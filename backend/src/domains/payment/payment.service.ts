import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { PaymentRepository } from './payment.repository';
import {
  CreatePaymentDto,
  PaymentQueryDto,
  PaymentResponse,
} from './payment.types';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['AUTHORIZED', 'FAILED', 'CAPTURED'],
  AUTHORIZED: ['CAPTURED', 'CANCELLED'],
  CAPTURED: ['REFUNDED'],
};

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly auditService: AuditService,
    private readonly orderWorkflowService: OrderWorkflowService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id:
        this.configService.get<string>('app.razorpay.keyId') || 'mock_key',
      key_secret:
        this.configService.get<string>('app.razorpay.keySecret') ||
        'mock_secret',
    });
  }

  private isRazorpayEnabled(): boolean {
    const enabled = this.configService.get<boolean>(
      'app.razorpay.enabled',
      true,
    );
    const keyId = this.configService.get<string>('app.razorpay.keyId');
    const keySecret = this.configService.get<string>('app.razorpay.keySecret');
    return (
      enabled && !!keyId && !!keySecret && keyId !== 'mock_key' && keyId !== ''
    );
  }

  private toResponse(p: any, includeTransactions = false): PaymentResponse {
    return {
      id: p.id,
      orderId: p.orderId,
      paymentNumber: p.paymentNumber,
      method: p.method,
      provider: p.provider,
      status: p.status,
      amount: Number(p.amount),
      currency: p.currency,
      providerOrderId: p.providerOrderId ?? undefined,
      transactionId: p.transactionId ?? undefined,
      transactions:
        includeTransactions && p.transactions
          ? p.transactions.map((t: any) => ({
              id: t.id,
              type: t.type,
              status: t.status,
              amount: Number(t.amount),
              providerRefId: t.providerRefId ?? undefined,
              createdAt: t.createdAt,
            }))
          : undefined,
      createdAt: p.createdAt,
    };
  }

  async findAll(query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.paymentRepository.findAll({
      orderId: query.orderId,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((p) => this.toResponse(p)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment)
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    return this.toResponse(payment, true);
  }

  async findByOrderId(orderId: string) {
    const payments = await this.paymentRepository.findByOrderId(orderId);
    return payments.map((p) => this.toResponse(p, true));
  }

  async create(userId: string, dto: CreatePaymentDto) {
    const paymentNumber = await this.paymentRepository.generatePaymentNumber();

    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new BusinessException('Order not found', 'ORDER_001');
    }

    let providerOrderId = `rzp_mock_${paymentNumber}`;

    if (this.isRazorpayEnabled()) {
      try {
        const razorpayOrder = await this.razorpay.orders.create({
          amount: Math.round(dto.amount * 100), // in paise
          currency: dto.currency || 'INR',
          receipt: paymentNumber,
        });
        providerOrderId = razorpayOrder.id;
      } catch (err: any) {
        throw new BusinessException(
          `Razorpay order creation failed: ${err.message || err}`,
          'PAYMENT_006',
        );
      }
    }

    const payment = await this.paymentRepository.create({
      order: { connect: { id: dto.orderId } },
      paymentNumber,
      method: dto.method,
      provider: dto.provider,
      amount: dto.amount,
      currency: dto.currency ?? 'INR',
      providerOrderId,
      createdBy: userId,
    });

    await this.auditService.log({
      action: 'PAYMENT_CREATED',
      module: 'payment',
      resource: 'Payment',
      resourceId: payment.id,
      userId,
    });

    return this.toResponse(payment, true);
  }

  async verifyPayment(
    id: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
  ) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    }
    if (payment.status === 'CAPTURED') {
      return this.toResponse(payment, true);
    }

    const keySecret =
      this.configService.get<string>('app.razorpay.keySecret') || '';
    const orderId = payment.providerOrderId;
    if (!orderId) {
      throw new BusinessException(
        'No provider order ID found on payment record',
        'PAYMENT_004',
      );
    }

    if (this.isRazorpayEnabled()) {
      const text = `${orderId}|${razorpayPaymentId}`;
      const generated = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      const genBuf = Buffer.from(generated);
      const sigBuf = Buffer.from(razorpaySignature);
      const isValid =
        genBuf.length === sigBuf.length &&
        crypto.timingSafeEqual(genBuf, sigBuf);

      if (!isValid) {
        await this.paymentRepository.update(id, {
          status: 'FAILED',
          providerPaymentId: razorpayPaymentId,
          metadata: {
            razorpayPaymentId,
            razorpaySignature,
            error: 'Signature mismatch',
          },
        });
        await this.paymentRepository.createTransaction({
          payment: { connect: { id } },
          type: 'FAILED',
          status: 'FAILED',
          amount: payment.amount,
          providerRefId: razorpayPaymentId,
        });
        throw new BusinessException(
          'Payment signature verification failed',
          'PAYMENT_005',
        );
      }
    }

    const updated = await this.paymentRepository.update(id, {
      status: 'CAPTURED',
      providerPaymentId: razorpayPaymentId,
      metadata: { razorpayPaymentId, razorpaySignature },
    });

    await this.paymentRepository.createTransaction({
      payment: { connect: { id } },
      type: 'CAPTURED',
      status: 'SUCCESS',
      amount: payment.amount,
      providerRefId: razorpayPaymentId,
    });

    // transition order
    await this.orderWorkflowService.transition(
      payment.orderId,
      'CONFIRMED',
      userId,
      'Payment verified successfully',
    );

    // Deduct stock. deductInventory is atomic and all-or-nothing; if it
    // throws (stock ran out between reservation and this payment capture),
    // the money has already been captured above, so this is a genuine
    // oversold-and-paid conflict. We cancel the order so stock isn't left
    // negative and the conflict is visible in the order timeline, but a
    // refund is NOT triggered automatically here -- that's a business
    // decision (refund vs. backorder vs. manual substitution) outside what
    // this fix covers, so it's surfaced via the thrown error / audit log for
    // a human to action rather than silently resolved.
    try {
      await this.orderWorkflowService.deductInventory(payment.orderId);
    } catch (err) {
      await this.orderWorkflowService.transition(
        payment.orderId,
        'CANCELLED',
        userId,
        'Auto-cancelled: insufficient stock after payment capture -- refund required',
      );
      throw err;
    }

    await this.orderWorkflowService.notifyOrderConfirmed(payment.orderId);

    await this.auditService.log({
      action: 'PAYMENT_CAPTURED',
      module: 'payment',
      resource: 'Payment',
      resourceId: id,
      userId,
    });

    return this.toResponse(updated, true);
  }

  /**
   * Actually moves money back to the customer via Razorpay's refund API,
   * rather than just bookkeeping a status change. Called by RefundService
   * when an admin approves a refund. Mirrors isRazorpayEnabled()'s mock
   * fallback used elsewhere in this service, so dev/unconfigured
   * environments behave the same way payment capture already does.
   */
  async refundPayment(
    paymentId: string,
    amount: number,
  ): Promise<{ razorpayRefundId: string; status: 'pending' | 'processed' | 'failed' }> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    }
    if (!payment.providerPaymentId) {
      throw new BusinessException(
        'This payment has no captured provider payment ID to refund',
        'PAYMENT_007',
      );
    }

    if (!this.isRazorpayEnabled()) {
      return { razorpayRefundId: `rfnd_mock_${Date.now()}`, status: 'processed' };
    }

    try {
      const refund = await this.razorpay.payments.refund(payment.providerPaymentId, {
        amount: Math.round(amount * 100),
      });
      return { razorpayRefundId: refund.id, status: refund.status };
    } catch (err: any) {
      throw new BusinessException(
        `Razorpay refund failed: ${err.message || err}`,
        'PAYMENT_008',
      );
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    const webhookSecret =
      this.configService.get<string>('app.razorpay.webhookSecret') || '';

    if (this.isRazorpayEnabled() && webhookSecret) {
      const generated = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const genBuf = Buffer.from(generated);
      const sigBuf = Buffer.from(signature);
      const isValid =
        genBuf.length === sigBuf.length &&
        crypto.timingSafeEqual(genBuf, sigBuf);

      if (!isValid) {
        throw new BusinessException(
          'Webhook signature verification failed',
          'PAYMENT_WEBHOOK_001',
        );
      }
    }

    const event = JSON.parse(rawBody);
    const payload = event.payload;

    if (event.event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const providerOrderId = paymentEntity.order_id;
      const providerPaymentId = paymentEntity.id;

      const payments = await this.prisma.payment.findMany({
        where: { providerOrderId },
      });
      if (payments.length === 0) {
        return { status: 'ignored', reason: 'Order not found' };
      }

      const payment = payments[0];
      if (payment.status === 'CAPTURED') {
        return { status: 'ignored', reason: 'Already captured' };
      }

      await this.paymentRepository.update(payment.id, {
        status: 'CAPTURED',
        providerPaymentId,
        metadata: paymentEntity,
      });

      await this.paymentRepository.createTransaction({
        payment: { connect: { id: payment.id } },
        type: 'CAPTURED',
        status: 'SUCCESS',
        amount: payment.amount,
        providerRefId: providerPaymentId,
      });

      await this.orderWorkflowService.transition(
        payment.orderId,
        'CONFIRMED',
        payment.createdBy || 'SYSTEM',
        'Payment captured via webhook',
      );

      // Same atomic-deduct-then-compensate handling as the direct verify
      // path above: capture already happened, so a shortage here is a
      // genuine oversold-and-paid conflict that needs a human to resolve
      // the refund, not something this fix silently papers over.
      try {
        await this.orderWorkflowService.deductInventory(payment.orderId);
      } catch (err) {
        await this.orderWorkflowService.transition(
          payment.orderId,
          'CANCELLED',
          payment.createdBy || 'SYSTEM',
          'Auto-cancelled: insufficient stock after payment capture -- refund required',
        );
        throw err;
      }

      await this.orderWorkflowService.notifyOrderConfirmed(payment.orderId);

      await this.auditService.log({
        action: 'PAYMENT_CAPTURED_WEBHOOK',
        module: 'payment',
        resource: 'Payment',
        resourceId: payment.id,
        userId: 'SYSTEM',
      });

      return { status: 'processed' };
    }

    if (event.event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const providerOrderId = paymentEntity.order_id;
      const providerPaymentId = paymentEntity.id;

      const payments = await this.prisma.payment.findMany({
        where: { providerOrderId },
      });
      if (payments.length > 0) {
        const payment = payments[0];
        if (payment.status === 'PENDING') {
          await this.paymentRepository.update(payment.id, {
            status: 'FAILED',
            providerPaymentId,
            metadata: paymentEntity,
          });

          await this.paymentRepository.createTransaction({
            payment: { connect: { id: payment.id } },
            type: 'FAILED',
            status: 'FAILED',
            amount: payment.amount,
            providerRefId: providerPaymentId,
          });

          await this.auditService.log({
            action: 'PAYMENT_FAILED_WEBHOOK',
            module: 'payment',
            resource: 'Payment',
            resourceId: payment.id,
            userId: 'SYSTEM',
          });
        }
      }
      return { status: 'processed' };
    }

    if (event.event === 'refund.processed') {
      const refundEntity = payload.refund.entity;
      const razorpayRefundId = refundEntity.id;

      const refund = await this.prisma.refund.findFirst({
        where: { transactionId: razorpayRefundId },
      });
      if (!refund) {
        return { status: 'ignored', reason: 'Refund not found' };
      }
      if (refund.status === 'COMPLETED') {
        return { status: 'ignored', reason: 'Already completed' };
      }

      await this.prisma.refund.update({
        where: { id: refund.id },
        data: { status: 'COMPLETED' },
      });

      await this.auditService.log({
        action: 'REFUND_COMPLETED_WEBHOOK',
        module: 'refund',
        resource: 'Refund',
        resourceId: refund.id,
        userId: 'SYSTEM',
      });

      return { status: 'processed' };
    }

    return { status: 'ignored', event: event.event };
  }

  async updateStatus(id: string, status: string, userId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment)
      throw new BusinessException('Payment not found', 'PAYMENT_001');

    const allowed = VALID_TRANSITIONS[payment.status];
    if (!allowed?.includes(status)) {
      throw new BusinessException(
        `Cannot transition from ${payment.status} to ${status}`,
        'PAYMENT_002',
      );
    }

    const updated = await this.paymentRepository.update(id, {
      status,
      updatedBy: userId,
    });
    await this.paymentRepository.createTransaction({
      payment: { connect: { id } },
      type: status,
      status: 'SUCCESS',
      amount: payment.amount,
    });

    const auditActions: Record<string, string> = {
      AUTHORIZED: 'PAYMENT_AUTHORIZED',
      CAPTURED: 'PAYMENT_CAPTURED',
      FAILED: 'PAYMENT_FAILED',
    };
    const auditAction = auditActions[status];
    if (auditAction) {
      await this.auditService.log({
        action: auditAction,
        module: 'payment',
        resource: 'Payment',
        resourceId: id,
        userId,
      });
    }

    return this.toResponse(updated, true);
  }
}
