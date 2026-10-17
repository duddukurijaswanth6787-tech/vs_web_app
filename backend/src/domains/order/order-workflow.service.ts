import { Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { EmailService } from '@domains/email/email.service';
import { OtpGatewayService } from '@domains/otp-gateway/otp-gateway.service';
import { TelegramService } from '@domains/telegram/telegram.service';
import { PrismaService } from '@database/prisma.service';
import type { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  OrderLifecycleService,
  type ShipmentDetails,
} from './order-lifecycle.service';
import { ORDER_TRANSITIONS } from './order-state';

@Injectable()
export class OrderWorkflowService {
  private readonly logger = new Logger(OrderWorkflowService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly otpGatewayService: OtpGatewayService,
    private readonly telegramService: TelegramService,
  ) {}

  private get lifecycle() {
    return new OrderLifecycleService(this.prisma);
  }

  async notifyOrderConfirmed(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        addresses: true,
        payments: true,
        customer: { include: { user: true } },
      },
    });
    if (!order) return;
    const user = order.customer.user;
    const shipping = order.addresses.find((a) => a.addressType === 'SHIPPING');
    const tasks: Promise<unknown>[] = [];
    if (user.email)
      tasks.push(
        this.emailService.sendOrderConfirmationEmail({
          to: user.email,
          userId: user.id,
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
        }),
      );
    if (shipping?.phone)
      tasks.push(
        this.otpGatewayService.sendOrderConfirmedSms({
          phone: shipping.phone,
          orderNumber: order.orderNumber,
          userId: user.id,
        }),
      );
    tasks.push(
      this.notificationService.notifyAdmins(
        'ORDER_CREATED',
        `Order confirmed: ${order.orderNumber}`,
        `Order ${order.orderNumber} for ₹${Number(order.grandTotal).toLocaleString('en-IN')} is ready for fulfillment.`,
        { orderId: order.id, orderNumber: order.orderNumber },
      ),
    );
    if (order.channel === 'ONLINE_STORE')
      tasks.push(
        this.telegramService.sendOnlineOrderAlert({
          orderNumber: order.orderNumber,
          customerName: shipping?.fullName || user.firstName,
          customerPhone: shipping?.phone || user.phone || 'N/A',
          shippingCity: shipping?.city || '',
          shippingState: shipping?.state || '',
          grandTotal: Number(order.grandTotal),
          paymentMethod: order.payments[0]?.method || 'Online',
          paymentStatus: order.status,
          items: order.items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            price: Number(i.unitPrice),
          })),
          createdAt: order.createdAt,
        }),
      );
    const results = await Promise.allSettled(tasks);
    for (const result of results)
      if (result.status === 'rejected')
        this.logger.warn(
          `Order ${order.orderNumber} notification failed: ${String(result.reason)}`,
        );
  }

  validateTransition(current: string, next: string) {
    if (!(ORDER_TRANSITIONS[current] ?? []).includes(next))
      throw new BusinessException(
        `Cannot transition from ${current} to ${next}`,
        'ORDER_002',
      );
  }
  canCancel(status: string) {
    return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(status);
  }
  canReturn(status: string) {
    return ['DELIVERED', 'RETURN_REJECTED', 'RETURN_COMPLETED'].includes(
      status,
    );
  }

  async afterTransition(
    orderId: string,
    nextStatus: string,
    userId: string,
    previousStatus?: string,
    message?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { include: { user: true } }, addresses: true },
    });
    if (!order) return;
    const titles: Record<string, string> = {
      CONFIRMED: 'Order confirmed',
      CANCELLED: 'Order cancelled',
      DELIVERED: 'Order delivered',
      RETURN_COMPLETED: 'Return completed',
    };
    const tasks: Promise<unknown>[] = [
      this.auditService.log({
        action: `ORDER_${nextStatus}`,
        module: 'orders',
        resource: 'order',
        resourceId: orderId,
        userId,
        oldValue: { status: previousStatus },
        newValue: { status: nextStatus },
      }),
    ];
    if (titles[nextStatus])
      tasks.push(
        this.notificationService.create({
          userId: order.customer.userId,
          type:
            nextStatus === 'CANCELLED'
              ? 'ORDER_CANCELLED'
              : nextStatus === 'DELIVERED'
                ? 'ORDER_DELIVERED'
                : nextStatus === 'RETURN_COMPLETED'
                  ? 'ORDER_RETURNED'
                  : 'ORDER_CREATED',
          title: titles[nextStatus],
          message: `Order ${order.orderNumber}: ${titles[nextStatus].toLowerCase()}`,
          data: { orderId, orderNumber: order.orderNumber, status: nextStatus },
        }),
      );
    tasks.push(
      this.telegramService.sendOrderStatusAlert({
        orderNumber: order.orderNumber,
        status: nextStatus,
        customerName:
          order.addresses[0]?.fullName || order.customer.user.firstName,
        grandTotal: Number(order.grandTotal),
        waybillNumber: order.waybillNumber || undefined,
        courierPartner: order.courierPartner || undefined,
        message,
      }),
    );
    const results = await Promise.allSettled(tasks);
    for (const result of results)
      if (result.status === 'rejected')
        this.logger.warn(
          `Order ${order.orderNumber} event delivery failed: ${String(result.reason)}`,
        );
    if (nextStatus === 'CONFIRMED')
      await this.notifyOrderConfirmed(orderId).catch((err) =>
        this.logger.warn(String(err)),
      );
  }

  async transition(
    orderId: string,
    status: string,
    userId: string,
    message?: string,
    shipment?: ShipmentDetails,
  ) {
    const result = await this.lifecycle.transition(
      orderId,
      status,
      userId,
      message,
      shipment,
    );
    if (result.changed)
      await this.afterTransition(
        orderId,
        status,
        userId,
        result.order.status,
        message,
      ).catch((err) => this.logger.warn(String(err)));
    return result.updated;
  }
  reserveInventory(orderId: string, userId = 'SYSTEM') {
    return this.lifecycle.inventory('reserve', orderId, userId);
  }
  reserveInventoryTx(
    tx: Prisma.TransactionClient,
    orderId: string,
    userId = 'SYSTEM',
  ) {
    return this.lifecycle.reserveTx(tx, orderId, userId);
  }
  releaseInventory(orderId: string, userId = 'SYSTEM') {
    return this.lifecycle.inventory('release', orderId, userId);
  }
  deductInventory(orderId: string, userId = 'SYSTEM') {
    return this.lifecycle.inventory('deduct', orderId, userId);
  }
  deductInventoryTx(
    tx: Prisma.TransactionClient,
    orderId: string,
    userId = 'SYSTEM',
  ) {
    return this.lifecycle.deductTx(tx, orderId, userId);
  }
  restoreInventory(orderId: string, userId = 'SYSTEM') {
    return this.lifecycle.inventory('restore', orderId, userId);
  }
  restockReturnedItems(
    tx: Prisma.TransactionClient,
    params: {
      orderId: string;
      orderNumber: string;
      items: { variantId: string | null; quantity: number }[];
      userId?: string;
      reason?: string;
    },
  ) {
    return this.lifecycle.restockTx(tx, params);
  }
  async capturePayment(
    paymentId: string,
    providerPaymentId: string,
    userId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    let result;
    try {
      result = await this.lifecycle.capturePayment(
        paymentId,
        providerPaymentId,
        userId,
        metadata,
      );
    } catch (err) {
      if (
        !(err instanceof BusinessException) ||
        err.errorCode !== 'ORDER_STOCK_CONFLICT'
      )
        throw err;
      // The gateway has received money even if stock was manually reduced.
      // Record that fact and safely cancel, without inventing a restock.
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });
      if (!payment) throw err;
      await this.prisma.$transaction(async (tx) => {
        await this.lifecycle.lockedOrder(tx, payment.orderId);
        const current = await tx.payment.findUniqueOrThrow({
          where: { id: paymentId },
        });
        if (current.status === 'REFUNDED') return;
        if (current.status !== 'CAPTURED') {
          await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'CAPTURED', providerPaymentId, metadata },
          });
          await tx.paymentTransaction.create({
            data: {
              paymentId,
              type: 'CAPTURED',
              status: 'SUCCESS',
              amount: current.amount,
              providerRefId: providerPaymentId,
            },
          });
        }
        await this.lifecycle.transitionTx(
          tx,
          payment.orderId,
          'CANCELLED',
          userId,
          'Payment received but stock is unavailable. Refund required.',
        );
      });
      await this.notificationService
        .notifyAdmins(
          'OUT_OF_STOCK',
          'Paid order needs a refund',
          `Order ${payment.orderId} received payment but could not be fulfilled. Review and refund the payment.`,
          { orderId: payment.orderId, paymentId },
        )
        .catch(() => {});
      return this.prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
      });
    }
    if (result.confirmed)
      await this.afterTransition(
        result.order.id,
        'CONFIRMED',
        userId,
        'PENDING',
      ).catch((err) => this.logger.warn(String(err)));
    return result.payment;
  }
  expireOrder(orderId: string, cutoff: Date) {
    return this.lifecycle.expire(orderId, cutoff);
  }
  async generateOrderNumber(channel = 'ONLINE') {
    const prefix = channel.toUpperCase().includes('POS')
      ? 'ORD-POS'
      : 'ORD-ONL';
    return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(5).toString('hex').toUpperCase()}`;
  }
}
