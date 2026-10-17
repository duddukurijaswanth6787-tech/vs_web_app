import type { Prisma, PrismaClient } from '@prisma/client';
import { BusinessException } from '@common/exceptions';
import { calculateStockStatus } from '@shared/inventory/stock-status.util';
import { getOrderState, ORDER_TRANSITIONS } from './order-state';

type Db = Pick<PrismaClient, '$transaction'>;
type Tx = Prisma.TransactionClient;
type StockRow = {
  id: string;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  reorderLevel: number;
  allowBackorder: boolean;
};
type StockOrder = Prisma.OrderGetPayload<{
  include: { items: true; payments: true; refunds: true };
}>;
export interface ShipmentDetails {
  courierPartner: string;
  waybillNumber: string;
  trackingUrl?: string;
}

// Status changes and stock operations serialize on the same order row.
export class OrderLifecycleService {
  constructor(private readonly db: Db) {}

  async lockedOrder(tx: Tx, orderId: string): Promise<StockOrder> {
    await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, refunds: true },
    });
    if (!order || order.deletedAt)
      throw new BusinessException('Order not found', 'ORDER_001');
    return order;
  }

  private lines(order: StockOrder) {
    const lines = new Map<string, { quantity: number; name: string }>();
    for (const item of order.items) {
      if (!item.variantId) continue;
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1)
        throw new BusinessException('Invalid item quantity', 'ORDER_QUANTITY');
      const previous = lines.get(item.variantId);
      lines.set(item.variantId, {
        quantity: (previous?.quantity ?? 0) + item.quantity,
        name: item.productName,
      });
    }
    return new Map([...lines].sort(([a], [b]) => a.localeCompare(b)));
  }

  private async movements(tx: Tx, orderId: string, variantId: string) {
    const rows = await tx.inventoryMovement.findMany({
      where: { referenceType: 'ORDER', referenceId: orderId, variantId },
    });
    const sum = (type: string) =>
      rows
        .filter((r) => r.movementType === type)
        .reduce((total, r) => total + r.quantity, 0);
    return {
      reserved: Math.max(0, sum('RESERVED') - sum('UNRESERVED') - sum('SALE')),
      sold: Math.max(0, sum('SALE') - sum('RESTORE') - sum('RETURN')),
    };
  }

  private async movement(
    tx: Tx,
    row: StockRow,
    variantId: string,
    orderId: string,
    type: string,
    quantity: number,
    before: number,
    userId: string,
  ) {
    await tx.inventoryMovement.create({
      data: {
        inventoryId: row.id,
        variantId,
        movementType: type,
        quantity,
        previousQuantity: before,
        newQuantity:
          type === 'RESERVED' || type === 'UNRESERVED'
            ? row.reservedQuantity
            : row.availableQuantity,
        referenceType: 'ORDER',
        referenceId: orderId,
        reason: `Order inventory ${type.toLowerCase()}`,
        performedBy: userId,
      },
    });
    await tx.inventory.update({
      where: { id: row.id },
      data: { stockStatus: calculateStockStatus(row) },
    });
  }

  async reserveTx(tx: Tx, orderId: string, userId: string) {
    const order = await this.lockedOrder(tx, orderId);
    if (order.status !== 'PENDING') return;
    for (const [variantId, line] of this.lines(order)) {
      const owned = await this.movements(tx, orderId, variantId);
      const quantity = Math.max(0, line.quantity - owned.reserved - owned.sold);
      if (!quantity) continue;
      const rows = await tx.$queryRaw<
        StockRow[]
      >`UPDATE "inventory" SET "reservedQuantity" = "reservedQuantity" + ${quantity}
        WHERE "variantId" = ${variantId} AND ("availableQuantity" - "reservedQuantity" >= ${quantity} OR "allowBackorder" = true)
        RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"`;
      if (!rows.length) {
        if (await tx.inventory.findUnique({ where: { variantId } }))
          throw new BusinessException(
            `Insufficient stock for ${line.name}`,
            'ORDER_003',
          );
        continue;
      }
      await this.movement(
        tx,
        rows[0],
        variantId,
        orderId,
        'RESERVED',
        quantity,
        rows[0].reservedQuantity - quantity,
        userId,
      );
    }
  }

  async deductTx(tx: Tx, orderId: string, userId: string) {
    const order = await this.lockedOrder(tx, orderId);
    for (const [variantId, line] of this.lines(order)) {
      const owned = await this.movements(tx, orderId, variantId);
      const quantity = Math.max(0, line.quantity - owned.sold);
      if (!quantity) continue;
      const reservation = Math.min(quantity, owned.reserved);
      const rows = await tx.$queryRaw<StockRow[]>`UPDATE "inventory"
        SET "availableQuantity" = "availableQuantity" - ${quantity}, "reservedQuantity" = GREATEST("reservedQuantity" - ${reservation}, 0)
        WHERE "variantId" = ${variantId} AND ("availableQuantity" - "reservedQuantity" + ${reservation} >= ${quantity} OR "allowBackorder" = true)
        RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"`;
      if (!rows.length) {
        if (await tx.inventory.findUnique({ where: { variantId } }))
          throw new BusinessException(
            'Insufficient stock to complete this order',
            'ORDER_STOCK_CONFLICT',
          );
        continue;
      }
      await this.movement(
        tx,
        rows[0],
        variantId,
        orderId,
        'SALE',
        quantity,
        rows[0].availableQuantity + quantity,
        userId,
      );
    }
  }

  async releaseTx(tx: Tx, orderId: string, userId: string) {
    const order = await this.lockedOrder(tx, orderId);
    for (const [variantId] of this.lines(order)) {
      const owned = await this.movements(tx, orderId, variantId);
      if (!owned.reserved) continue;
      const rows = await tx.$queryRaw<
        StockRow[]
      >`UPDATE "inventory" SET "reservedQuantity" = GREATEST("reservedQuantity" - ${owned.reserved}, 0)
        WHERE "variantId" = ${variantId}
        RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"`;
      if (rows.length)
        await this.movement(
          tx,
          rows[0],
          variantId,
          orderId,
          'UNRESERVED',
          owned.reserved,
          rows[0].reservedQuantity + owned.reserved,
          userId,
        );
    }
  }

  async restoreTx(tx: Tx, orderId: string, userId: string) {
    const order = await this.lockedOrder(tx, orderId);
    for (const [variantId] of this.lines(order)) {
      const owned = await this.movements(tx, orderId, variantId);
      if (!owned.sold) continue;
      const rows = await tx.$queryRaw<
        StockRow[]
      >`UPDATE "inventory" SET "availableQuantity" = "availableQuantity" + ${owned.sold}
        WHERE "variantId" = ${variantId}
        RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"`;
      if (rows.length)
        await this.movement(
          tx,
          rows[0],
          variantId,
          orderId,
          'RESTORE',
          owned.sold,
          rows[0].availableQuantity - owned.sold,
          userId,
        );
    }
    await this.releaseTx(tx, orderId, userId);
  }

  async restockTx(
    tx: Tx,
    params: {
      orderId: string;
      items: { variantId: string | null; quantity: number }[];
      userId?: string;
    },
  ) {
    await this.lockedOrder(tx, params.orderId);
    const quantities = new Map<string, number>();
    for (const item of params.items)
      if (item.variantId)
        quantities.set(
          item.variantId,
          (quantities.get(item.variantId) ?? 0) + item.quantity,
        );
    for (const [variantId, quantity] of quantities) {
      if (!Number.isSafeInteger(quantity) || quantity <= 0)
        throw new BusinessException('Invalid return quantity', 'RETURN_004');
      const stock = await tx.inventory.findUnique({ where: { variantId } });
      if (!stock) continue;
      const owned = await this.movements(tx, params.orderId, variantId);
      if (quantity > owned.sold)
        throw new BusinessException(
          'Return quantity exceeds stock sold on this order',
          'RETURN_004',
        );
      const rows = await tx.$queryRaw<
        StockRow[]
      >`UPDATE "inventory" SET "availableQuantity" = "availableQuantity" + ${quantity}
        WHERE "variantId" = ${variantId}
        RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"`;
      if (rows.length)
        await this.movement(
          tx,
          rows[0],
          variantId,
          params.orderId,
          'RETURN',
          quantity,
          rows[0].availableQuantity - quantity,
          params.userId ?? 'SYSTEM',
        );
    }
  }

  async transitionTx(
    tx: Tx,
    orderId: string,
    nextStatus: string,
    userId: string,
    message?: string,
    shipment?: ShipmentDetails,
  ) {
    const order = await this.lockedOrder(tx, orderId);
    if (order.status === nextStatus)
      return { order, updated: order, changed: false };
    if (!(ORDER_TRANSITIONS[order.status] ?? []).includes(nextStatus))
      throw new BusinessException(
        `Cannot transition from ${order.status} to ${nextStatus}`,
        'ORDER_002',
      );
    if (
      [
        'CONFIRMED',
        'PROCESSING',
        'PACKING',
        'READY_TO_SHIP',
        'SHIPPED',
      ].includes(nextStatus) &&
      !getOrderState(order).canFulfill
    ) {
      throw new BusinessException(
        'Payment must be received in full before fulfillment can continue.',
        'ORDER_PAYMENT_PENDING',
      );
    }
    if (
      nextStatus === 'SHIPPED' &&
      !(shipment?.waybillNumber || order.waybillNumber)?.trim()
    ) {
      throw new BusinessException(
        'Record the actual courier waybill before marking this order shipped.',
        'ORDER_WAYBILL_REQUIRED',
      );
    }
    if (nextStatus === 'CONFIRMED') await this.deductTx(tx, orderId, userId);
    if (nextStatus === 'CANCELLED') await this.restoreTx(tx, orderId, userId);
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        updatedBy: userId,
        ...(shipment
          ? {
              courierPartner: shipment.courierPartner,
              waybillNumber: shipment.waybillNumber,
              trackingUrl: shipment.trackingUrl,
            }
          : {}),
      },
    });
    await tx.orderTimeline.create({
      data: {
        orderId,
        status: nextStatus,
        message: message || `Status changed to ${nextStatus}`,
        createdBy: userId,
      },
    });
    return { order, updated, changed: true };
  }

  transition(
    orderId: string,
    status: string,
    userId: string,
    message?: string,
    shipment?: ShipmentDetails,
  ) {
    return this.db.$transaction((tx) =>
      this.transitionTx(tx, orderId, status, userId, message, shipment),
    );
  }

  async capturePayment(
    paymentId: string,
    providerPaymentId: string,
    userId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    return this.db.$transaction(async (tx) => {
      const initial = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!initial)
        throw new BusinessException('Payment not found', 'PAYMENT_001');
      const order = await this.lockedOrder(tx, initial.orderId);
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment)
        throw new BusinessException('Payment not found', 'PAYMENT_001');
      if (payment.status === 'REFUNDED')
        return { payment, confirmed: false, order };
      if (
        payment.status === 'CAPTURED' &&
        payment.providerPaymentId &&
        payment.providerPaymentId !== providerPaymentId
      ) {
        throw new BusinessException(
          'This payment was already captured with a different transaction.',
          'PAYMENT_DUPLICATE_CAPTURE',
        );
      }
      let captured = payment;
      if (payment.status !== 'CAPTURED') {
        captured = await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'CAPTURED', providerPaymentId, metadata },
        });
        await tx.paymentTransaction.create({
          data: {
            paymentId,
            type: 'CAPTURED',
            status: 'SUCCESS',
            amount: payment.amount,
            providerRefId: providerPaymentId,
          },
        });
      }
      if (order.status === 'CANCELLED') {
        if (payment.status !== 'CAPTURED')
          await tx.orderTimeline.create({
            data: {
              orderId: order.id,
              status: 'CANCELLED',
              message:
                'Payment received after cancellation. Refund review required.',
              createdBy: userId,
            },
          });
        return { payment: captured, confirmed: false, order };
      }
      if (order.status === 'PENDING') {
        const latest = await this.lockedOrder(tx, order.id);
        if (!getOrderState(latest).canFulfill)
          return { payment: captured, confirmed: false, order: latest };
        const transition = await this.transitionTx(
          tx,
          order.id,
          'CONFIRMED',
          userId,
          'Payment captured and order confirmed',
        );
        return {
          payment: captured,
          confirmed: transition.changed,
          order: transition.updated,
        };
      }
      if (order.status === 'CONFIRMED')
        await this.deductTx(tx, order.id, userId);
      return { payment: captured, confirmed: false, order };
    });
  }

  async expire(orderId: string, cutoff: Date, userId = 'SYSTEM') {
    return this.db.$transaction(async (tx) => {
      const order = await this.lockedOrder(tx, orderId);
      const state = getOrderState(order);
      if (
        order.status !== 'PENDING' ||
        order.createdAt > cutoff ||
        state.canFulfill ||
        state.paidAmount > 0
      )
        return false;
      await this.transitionTx(
        tx,
        orderId,
        'CANCELLED',
        userId,
        'Payment window expired. Reserved stock released.',
      );
      await tx.payment.updateMany({
        where: { orderId, status: { in: ['PENDING', 'AUTHORIZED', 'FAILED'] } },
        data: { status: 'FAILED' },
      });
      return true;
    });
  }

  inventory(
    action: 'reserve' | 'deduct' | 'release' | 'restore',
    orderId: string,
    userId: string,
  ) {
    return this.db.$transaction((tx) =>
      this[`${action}Tx`](tx, orderId, userId),
    );
  }
}
