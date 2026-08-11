import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { PrismaService } from '@database/prisma.service';

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
  ) {}

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

  async reserveInventory(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    for (const item of order.items) {
      if (item.variantId) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          const available =
            inventory.availableQuantity - inventory.reservedQuantity;
          if (available < item.quantity && !inventory.allowBackorder) {
            throw new BusinessException(
              `Insufficient stock for ${item.productName}`,
              'ORDER_003',
            );
          }
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              reservedQuantity: inventory.reservedQuantity + item.quantity,
            },
          });
        }
      }
    }
  }

  async releaseInventory(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    for (const item of order.items) {
      if (item.variantId) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          const newReserved = Math.max(
            0,
            inventory.reservedQuantity - item.quantity,
          );
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: { reservedQuantity: newReserved },
          });
        }
      }
    }
  }

  async deductInventory(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    for (const item of order.items) {
      if (item.variantId) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          const newReserved = Math.max(
            0,
            inventory.reservedQuantity - item.quantity,
          );
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              availableQuantity: inventory.availableQuantity - item.quantity,
              reservedQuantity: newReserved,
            },
          });
        }
      }
    }
  }

  async restoreInventory(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    for (const item of order.items) {
      if (item.variantId) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              availableQuantity: inventory.availableQuantity + item.quantity,
            },
          });
        }
      }
    }
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
