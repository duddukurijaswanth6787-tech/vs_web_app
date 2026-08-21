import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { EmailService } from '@domains/email/email.service';
import { OtpGatewayService } from '@domains/otp-gateway/otp-gateway.service';
import { calculateStockStatus } from '@shared/inventory/stock-status.util';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

interface InventoryRow {
  id: string;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  reorderLevel: number;
  allowBackorder: boolean;
}

const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKING', 'CANCELLED'],
  PACKING: ['READY_TO_SHIP'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
  RETURN_APPROVED: ['RETURN_COMPLETED'],
  RETURN_REJECTED: [],
  RETURN_COMPLETED: [],
  CANCELLED: [],
};

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];
const RETURNABLE_STATUSES = ['DELIVERED'];

@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly otpGatewayService: OtpGatewayService,
  ) {}

  /**
   * Sends the "your order is confirmed" email + SMS. Called once per order,
   * from whichever path actually confirms it -- immediately at checkout for
   * COD (no gateway step to wait for), or after Razorpay capture succeeds
   * (see PaymentService) so an online-payment order isn't "confirmed" before
   * the customer has actually paid.
   */
  async notifyOrderConfirmed(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        addresses: true,
        customer: { include: { user: true } },
      },
    });
    if (!order) return;

    const email = order.customer?.user?.email;
    if (email) {
      await this.emailService.sendOrderConfirmationEmail({
        to: email,
        userId: order.customer.userId,
        orderNumber: order.orderNumber,
        items: order.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discountTotal),
        taxTotal: Number(order.taxTotal),
        shippingCharge: Number(order.shippingCharge),
        grandTotal: Number(order.grandTotal),
      });
    }

    const phone = order.addresses?.[0]?.phone;
    if (phone) {
      await this.otpGatewayService.sendOrderConfirmedSms({
        phone,
        orderNumber: order.orderNumber,
        userId: order.customer?.userId,
      });
    }
  }

  validateTransition(currentStatus: string, nextStatus: string): void {
    const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BusinessException(
        `Cannot transition from ${currentStatus} to ${nextStatus}`,
        'ORDER_002',
      );
    }
  }

  canCancel(status: string): boolean {
    return CANCELLABLE_STATUSES.includes(status);
  }

  canReturn(status: string): boolean {
    return RETURNABLE_STATUSES.includes(status);
  }

  async transition(
    orderId: string,
    nextStatus: string,
    userId: string,
    message?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    this.validateTransition(order.status, nextStatus);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: nextStatus, updatedBy: userId },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: nextStatus,
          message: message ?? `Status changed to ${nextStatus}`,
          createdBy: userId,
        },
      }),
    ]);

    await this.auditService.log({
      action: `ORDER_${nextStatus}`,
      module: 'orders',
      resource: 'order',
      resourceId: orderId,
      userId,
      oldValue: { status: order.status },
      newValue: { status: nextStatus },
    });

    const notifTypes: Record<string, { type: string; title: string }> = {
      CONFIRMED: { type: 'ORDER_CREATED', title: 'New Order Confirmed' },
      CANCELLED: { type: 'ORDER_CANCELLED', title: 'Order Cancelled' },
      DELIVERED: { type: 'ORDER_DELIVERED', title: 'Order Delivered' },
      RETURN_COMPLETED: { type: 'ORDER_RETURNED', title: 'Return Completed' },
    };
    const notif = notifTypes[nextStatus];
    if (notif) {
      await this.notificationService.create({
        userId: order.customerId,
        type: notif.type,
        title: notif.title,
        message:
          nextStatus === 'DELIVERED'
            ? `Your order #${order.orderNumber} has been delivered! Share your feedback & earn 50 reward points.`
            : `Order #${order.orderNumber} ${notif.title.toLowerCase()}`,
        data: { orderId, orderNumber: order.orderNumber, status: nextStatus },
      });
    }

    return updated;
  }

  /**
   * Logs the movement and recalculates stockStatus for a row already
   * updated by a guarded raw SQL statement, inside the same transaction.
   * `row` must carry the POST-update quantities (via a RETURNING clause) so
   * the previous value can be reverse-derived from the delta actually
   * applied -- no second read, so nothing can drift between the write and
   * the log within this transaction.
   */
  private async logMovement(
    tx: Prisma.TransactionClient,
    row: InventoryRow,
    params: {
      variantId: string;
      movementType: string;
      quantity: number;
      previousAvailable: number;
      referenceType: string;
      referenceId: string;
      reason: string;
      performedBy?: string;
    },
  ) {
    await tx.inventoryMovement.create({
      data: {
        inventory: { connect: { id: row.id } },
        variantId: params.variantId,
        movementType: params.movementType,
        quantity: params.quantity,
        previousQuantity: params.previousAvailable,
        newQuantity: row.availableQuantity,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        reason: params.reason,
        performedBy: params.performedBy,
      },
    });
    const status = calculateStockStatus(row);
    await tx.inventory.update({ where: { id: row.id }, data: { stockStatus: status } });
  }

  /**
   * Reserves stock for an order's items. Uses a guarded `UPDATE ... WHERE`
   * (not a read-then-write) so concurrent reservations for the same variant
   * serialize on the DB row lock instead of both reading the same
   * pre-reservation snapshot and over-reserving it -- the classic TOCTOU race
   * that let checkout oversell under concurrency.
   */
  async reserveInventory(orderId: string, userId = 'SYSTEM') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    await this.prisma.$transaction(async (tx) => {
      const shortages: {
        variantId: string;
        productName: string;
        variantTitle?: string | null;
        requested: number;
        available: number;
      }[] = [];

      for (const item of order.items) {
        if (!item.variantId) continue;

        const rows = await tx.$queryRaw<InventoryRow[]>`
          UPDATE "inventory"
          SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}
          WHERE "variantId" = ${item.variantId}
            AND ("availableQuantity" - "reservedQuantity" >= ${item.quantity} OR "allowBackorder" = true)
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;

        if (rows.length === 0) {
          const current = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });
          if (current) {
            shortages.push({
              variantId: item.variantId,
              productName: item.productName,
              variantTitle: item.variantTitle,
              requested: item.quantity,
              available: current.availableQuantity - current.reservedQuantity,
            });
          }
          // No inventory row at all: same as the pre-existing behaviour,
          // silently skipped (not every variant is stock-tracked).
          continue;
        }

        await this.logMovement(tx, rows[0], {
          variantId: item.variantId,
          movementType: 'RESERVED',
          quantity: item.quantity,
          previousAvailable: rows[0].reservedQuantity - item.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: `Order ${order.orderNumber} reserved`,
          performedBy: userId,
        });
      }

      if (shortages.length > 0) {
        throw new BusinessException(
          `Insufficient stock for ${shortages[0].productName}`,
          'ORDER_003',
          { shortages },
        );
      }
    });
  }

  async releaseInventory(orderId: string, userId = 'SYSTEM') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;

        const rows = await tx.$queryRaw<InventoryRow[]>`
          UPDATE "inventory"
          SET "reservedQuantity" = GREATEST("reservedQuantity" - ${item.quantity}, 0)
          WHERE "variantId" = ${item.variantId}
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;
        if (rows.length === 0) continue;

        await this.logMovement(tx, rows[0], {
          variantId: item.variantId,
          movementType: 'UNRESERVED',
          quantity: item.quantity,
          previousAvailable: rows[0].reservedQuantity + item.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: `Order ${order.orderNumber} reservation released`,
          performedBy: userId,
        });
      }
    });
  }

  /**
   * Deducts stock for an order's items, atomically and all-or-nothing: each
   * variant's decrement is a guarded `UPDATE ... WHERE availableQuantity >=
   * quantity` (or allowBackorder), so it can never push stock negative even
   * when two orders for the same scarce variant are being deducted at the
   * same instant -- the second one to reach the row simply fails the guard
   * instead of both succeeding. If any item is short, the whole deduction
   * for this order is rolled back (no partial deduction) and a
   * BusinessException carrying the shortages is thrown.
   */
  async deductInventory(orderId: string, userId = 'SYSTEM') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    await this.prisma.$transaction(async (tx) => {
      const shortages: {
        variantId: string;
        productName: string;
        variantTitle?: string | null;
        requested: number;
        available: number;
      }[] = [];

      for (const item of order.items) {
        if (!item.variantId) continue;

        const rows = await tx.$queryRaw<InventoryRow[]>`
          UPDATE "inventory"
          SET "availableQuantity" = "availableQuantity" - ${item.quantity},
              "reservedQuantity" = GREATEST("reservedQuantity" - ${item.quantity}, 0)
          WHERE "variantId" = ${item.variantId}
            AND ("availableQuantity" >= ${item.quantity} OR "allowBackorder" = true)
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;

        if (rows.length === 0) {
          const current = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });
          if (current) {
            shortages.push({
              variantId: item.variantId,
              productName: item.productName,
              variantTitle: item.variantTitle,
              requested: item.quantity,
              available: current.availableQuantity,
            });
          }
          // No inventory row at all: preserved pre-existing behaviour of
          // silently skipping the deduction for untracked variants.
          continue;
        }

        await this.logMovement(tx, rows[0], {
          variantId: item.variantId,
          movementType: 'SALE',
          quantity: item.quantity,
          previousAvailable: rows[0].availableQuantity + item.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: `Order ${order.orderNumber} sold`,
          performedBy: userId,
        });
      }

      if (shortages.length > 0) {
        throw new BusinessException(
          'Insufficient stock to complete this order',
          'ORDER_STOCK_CONFLICT',
          { shortages },
        );
      }
    });
  }

  async restoreInventory(orderId: string, userId = 'SYSTEM') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;

        const rows = await tx.$queryRaw<InventoryRow[]>`
          UPDATE "inventory"
          SET "availableQuantity" = "availableQuantity" + ${item.quantity}
          WHERE "variantId" = ${item.variantId}
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;
        if (rows.length === 0) continue;

        await this.logMovement(tx, rows[0], {
          variantId: item.variantId,
          movementType: 'RESTORE',
          quantity: item.quantity,
          previousAvailable: rows[0].availableQuantity - item.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: `Order ${order.orderNumber} cancelled/returned -- stock restored`,
          performedBy: userId,
        });
      }
    });
  }

  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${dateStr}-`;

    const lastOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.slice(-6), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(6, '0')}`;
  }
}
