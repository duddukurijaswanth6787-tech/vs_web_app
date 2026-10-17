import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { NotificationService } from '@domains/notification/notification.service';
import { AppSettingRepository } from '@domains/app-setting/app-setting.repository';
import { PaymentRepository } from './payment.repository';
import {
  CreatePaymentDto,
  PaymentQueryDto,
  PaymentResponse,
  RazorpayConfigResponse,
  UpdateRazorpayConfigDto,
} from './payment.types';
import Razorpay from 'razorpay';
import { getOrderState } from '@domains/order/order-state';
import { OrderLifecycleService } from '@domains/order/order-lifecycle.service';
import * as crypto from 'crypto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['AUTHORIZED', 'FAILED', 'CAPTURED'],
  AUTHORIZED: ['CAPTURED', 'CANCELLED'],
  CAPTURED: ['REFUNDED'],
};

const GROUP = 'razorpay';
const KEYS = {
  keyId: 'razorpay.key_id',
  keySecret: 'razorpay.key_secret',
  webhookSecret: 'razorpay.webhook_secret',
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly auditService: AuditService,
    private readonly orderWorkflowService: OrderWorkflowService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly settingRepository: AppSettingRepository,
    _notificationService: NotificationService,
  ) {}

  /**
   * Razorpay credentials are admin-configurable (Admin > Access > Login
   * Sessions, same pattern as the StartMessaging API key and Google Client
   * ID) so they can be set/rotated without a redeploy. A DB-stored value
   * takes priority over the env var if both are present. Unlike the key ID,
   * the key secret and webhook secret are real secrets -- write-only, never
   * returned by getConfig().
   */
  private async getEffectiveKeyId(): Promise<string> {
    const dbValue = await this.settingRepository.getByKey(KEYS.keyId);
    return dbValue || this.configService.get<string>('app.razorpay.keyId', '');
  }

  private async getEffectiveKeySecret(): Promise<string> {
    const dbValue = await this.settingRepository.getByKey(KEYS.keySecret);
    return (
      dbValue || this.configService.get<string>('app.razorpay.keySecret', '')
    );
  }

  private async getEffectiveWebhookSecret(): Promise<string> {
    const dbValue = await this.settingRepository.getByKey(KEYS.webhookSecret);
    return (
      dbValue ||
      this.configService.get<string>('app.razorpay.webhookSecret', '')
    );
  }

  async getConfig(): Promise<RazorpayConfigResponse> {
    const [keyId, keySecret, webhookSecret] = await Promise.all([
      this.getEffectiveKeyId(),
      this.getEffectiveKeySecret(),
      this.getEffectiveWebhookSecret(),
    ]);
    return {
      keyId,
      keySecretConfigured: !!keySecret,
      webhookSecretConfigured: !!webhookSecret,
    };
  }

  async updateConfig(
    dto: UpdateRazorpayConfigDto,
    userId: string,
  ): Promise<RazorpayConfigResponse> {
    const upsert = async (key: string, value: string, description: string) => {
      const existing = await this.settingRepository.findByKey(key);
      if (existing) {
        await this.settingRepository.update(existing.id, { value });
      } else {
        await this.settingRepository.create({
          key,
          value,
          group: GROUP,
          description,
        });
      }
    };
    if (dto.keyId !== undefined) {
      await upsert(
        KEYS.keyId,
        dto.keyId,
        'Razorpay Key ID (public, safe to expose to frontend)',
      );
    }
    if (dto.keySecret !== undefined) {
      await upsert(
        KEYS.keySecret,
        dto.keySecret,
        'Razorpay Key Secret (private)',
      );
    }
    if (dto.webhookSecret !== undefined) {
      await upsert(
        KEYS.webhookSecret,
        dto.webhookSecret,
        'Razorpay Webhook Secret (private)',
      );
    }
    await this.auditService.log({
      action: 'RAZORPAY_CONFIG_UPDATED',
      module: 'payment',
      resource: 'app_setting',
      userId,
      // Never audit-log the secrets themselves -- just whether they changed.
      newValue: {
        keyId: dto.keyId,
        keySecret: dto.keySecret !== undefined ? '[redacted]' : undefined,
        webhookSecret:
          dto.webhookSecret !== undefined ? '[redacted]' : undefined,
      },
    });
    return this.getConfig();
  }

  private async isRazorpayEnabled(): Promise<boolean> {
    const enabled = this.configService.get<boolean>(
      'app.razorpay.enabled',
      true,
    );
    const [keyId, keySecret] = await Promise.all([
      this.getEffectiveKeyId(),
      this.getEffectiveKeySecret(),
    ]);
    return enabled && !!keyId && !!keySecret;
  }

  gatewayAvailable() { return this.isRazorpayEnabled(); }

  private async getRazorpayClient(): Promise<Razorpay> {
    const [keyId, keySecret] = await Promise.all([
      this.getEffectiveKeyId(),
      this.getEffectiveKeySecret(),
    ]);
    return new Razorpay({
      key_id: keyId || 'mock_key',
      key_secret: keySecret || 'mock_secret',
    });
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

  private async ownedOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { customer: true, payments: true, refunds: true } });
    if (!order || order.deletedAt || order.customer.userId !== userId) throw new BusinessException('Order not found', 'ORDER_001');
    return order;
  }

  private validateProviderPayment(payment: any, entity: any) {
    if (entity.order_id !== payment.providerOrderId || Number(entity.amount) !== Math.round(Number(payment.amount) * 100) || entity.currency !== payment.currency) {
      throw new BusinessException('Gateway payment does not match this order amount and currency.', 'PAYMENT_AMOUNT_MISMATCH');
    }
  }

  async create(userId: string, dto: CreatePaymentDto) {
    await this.ownedOrder(dto.orderId, userId);
    if (!(await this.isRazorpayEnabled())) throw new BusinessException('Online payment is temporarily unavailable. Please try later.', 'PAYMENT_GATEWAY_UNAVAILABLE');
    const keyId = await this.getEffectiveKeyId();
    // Holding the order lock keeps concurrent retry calls from creating two gateway orders.
    const payment = await this.prisma.$transaction(async (tx) => {
      const order = await new OrderLifecycleService(this.prisma).lockedOrder(tx, dto.orderId);
      if (order.status !== 'PENDING' || !getOrderState(order).canRetryPayment) throw new BusinessException('This order is not awaiting online payment.', 'PAYMENT_ORDER_STATE');
      const amount = getOrderState(order).amountDue;
      if (Math.round(dto.amount * 100) !== Math.round(amount * 100) || (dto.currency && dto.currency !== order.currency)) {
        throw new BusinessException('Payment amount must match the outstanding order total.', 'PAYMENT_AMOUNT_MISMATCH');
      }
      const existing = order.payments.find((p) => ['PENDING', 'AUTHORIZED', 'FAILED'].includes(p.status) && p.providerOrderId && !p.providerOrderId.startsWith('rzp_mock_') && Number(p.amount) === amount);
      if (existing) return existing;
      const paymentNumber = await this.paymentRepository.generatePaymentNumber();
      let providerOrderId: string;
      try {
        const gateway = await this.getRazorpayClient();
        const provider = await gateway.orders.create({ amount: Math.round(amount * 100), currency: order.currency, receipt: paymentNumber });
        providerOrderId = provider.id;
      } catch { throw new BusinessException('Could not open online payment. Please retry this order.', 'PAYMENT_006'); }
      return tx.payment.create({ data: { orderId: order.id, paymentNumber, method: 'RAZORPAY', provider: 'razorpay',
        amount, currency: order.currency, providerOrderId, createdBy: userId } });
    }, { timeout: 20000 });
    return { ...this.toResponse(payment, true), razorpayKeyId: keyId };
  }

  async verifyPayment(id: string, razorpayPaymentId: string, razorpaySignature: string, userId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new BusinessException('Payment not found', 'PAYMENT_001');
    await this.ownedOrder(payment.orderId, userId);
    if (!(await this.isRazorpayEnabled())) throw new BusinessException('Online payment verification is unavailable.', 'PAYMENT_GATEWAY_UNAVAILABLE');
    if (!payment.providerOrderId) throw new BusinessException('Payment is not connected to a gateway order.', 'PAYMENT_004');
    const secret = await this.getEffectiveKeySecret();
    const generated = crypto.createHmac('sha256', secret).update(payment.providerOrderId + '|' + razorpayPaymentId).digest('hex');
    const expected = Buffer.from(generated), received = Buffer.from(razorpaySignature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) throw new BusinessException('Payment signature verification failed.', 'PAYMENT_005');
    const gateway = await this.getRazorpayClient();
    const entity = await gateway.payments.fetch(razorpayPaymentId);
    this.validateProviderPayment(payment, entity);
    if (entity.status !== 'captured') {
      if (entity.status === 'authorized') {
        await this.prisma.payment.updateMany({ where: { id, status: { notIn: ['CAPTURED', 'REFUNDED'] } }, data: { status: 'AUTHORIZED', providerPaymentId: razorpayPaymentId } });
        return this.toResponse(await this.paymentRepository.findById(id), true);
      }
      throw new BusinessException('The gateway has not received this payment. Please check the order before paying again.', 'PAYMENT_NOT_CAPTURED');
    }
    await this.orderWorkflowService.capturePayment(id, razorpayPaymentId, userId, entity as any);
    return this.toResponse(await this.paymentRepository.findById(id), true);
  }

  /**
   * Actually moves money back to the customer via Razorpay's refund API,
   * rather than just bookkeeping a status change. Called by RefundService
   * when an admin approves a refund. The refund record is the stable
   * idempotency key, so repeated approval cannot transfer money twice.
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    refundId?: string,
  ): Promise<{
    razorpayRefundId: string;
    status: 'pending' | 'processed' | 'failed';
  }> {
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

    if (!(await this.isRazorpayEnabled())) throw new BusinessException('Refund gateway unavailable.', 'PAYMENT_GATEWAY_UNAVAILABLE');

    try {
      const [keyId, secret] = await Promise.all([this.getEffectiveKeyId(), this.getEffectiveKeySecret()]);
      const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.providerPaymentId)}/refund`, {
        method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(keyId + ':' + secret).toString('base64'),
          'Content-Type': 'application/json', 'X-Refund-Idempotency': refundId || paymentId + '-' + Math.round(amount * 100) },
        body: JSON.stringify({ amount: Math.round(amount * 100), speed: 'normal', receipt: refundId }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Gateway did not accept this refund. Check its status before retrying.');
      const refund = await response.json() as { id: string; status: 'pending' | 'processed' | 'failed' };
      return { razorpayRefundId: refund.id, status: refund.status };
    } catch (err: any) {
      throw new BusinessException(
        `Razorpay refund failed: ${err.message || err}`,
        'PAYMENT_008',
      );
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    {
      const webhookSecret = await this.getEffectiveWebhookSecret();
      // Fail closed: an unconfigured secret must reject the webhook, not
      // skip verification. The previous `&& webhookSecret` guard let anyone
      // who found this URL POST a fake payment.captured event and have it
      // processed as real (capturing the order, deducting stock) for as
      // long as the admin hadn't set a webhook secret yet.
      if (!webhookSecret) {
        throw new BusinessException(
          'Webhook secret not configured',
          'PAYMENT_WEBHOOK_002',
        );
      }

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
      const entity = payload.payment.entity;
      const payment = await this.prisma.payment.findFirst({ where: { providerOrderId: entity.order_id } });
      if (!payment) return { status: 'ignored', reason: 'Order not found' };
      this.validateProviderPayment(payment, entity);
      if (entity.status !== 'captured') throw new BusinessException('Capture event has not captured a payment.', 'PAYMENT_NOT_CAPTURED');
      await this.orderWorkflowService.capturePayment(payment.id, entity.id, payment.createdBy || 'SYSTEM', entity);
      return { status: 'processed' };
    }
    if (event.event === 'payment.failed') {
      const entity = payload.payment.entity;
      // A failed attempt may be retried on the same provider order. Keep the
      // reservation until expiry, and never overwrite an already captured payment.
      await this.prisma.payment.updateMany({ where: { providerOrderId: entity.order_id, status: { in: ['PENDING', 'FAILED'] } },
        data: { status: 'FAILED', providerPaymentId: entity.id, metadata: entity } });
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

  async confirmRefund(paymentId: string, providerRefundId: string, amount: number) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment?.providerPaymentId || !(await this.isRazorpayEnabled())) throw new BusinessException('Refund verification is unavailable.', 'REFUND_VERIFY_UNAVAILABLE');
    const gateway = await this.getRazorpayClient();
    const refund = await gateway.refunds.fetch(providerRefundId);
    if (refund.payment_id !== payment.providerPaymentId || Number(refund.amount) !== Math.round(amount * 100) || refund.status !== 'processed') {
      throw new BusinessException('The gateway has not completed this refund.', 'REFUND_NOT_COMPLETED');
    }
  }

  async updateStatus(id: string, status: string, userId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment)
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    if (['CAPTURED', 'REFUNDED'].includes(status) && payment.provider === 'razorpay') {
      throw new BusinessException('Use gateway sync for payment receipt and Refunds for returning money.', 'PAYMENT_GATEWAY_ACTION');
    }

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

  /**
   * Generates a live Razorpay Dynamic UPI QR code.
   * Scanned payments are credited directly to the Razorpay merchant account.
   */
  async createDynamicUpiQr(
    amount: number,
    description = 'POS Counter Bill',
    notes: Record<string, string> = {},
  ) {
    const razorpay = await this.getRazorpayClient();
    const amountInPaise = Math.round(amount * 100);
    const closeBy = Math.floor(Date.now() / 1000) + 900; // 15 mins expiry

    try {
      const qr: any = await razorpay.qrCode.create({
        type: 'upi_qr',
        name: "Vasanthi's Signature",
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: amountInPaise,
        description,
        close_by: closeBy,
        notes,
      });

      return {
        qrId: qr.id,
        imageUrl: qr.image_url,
        amount: Number(qr.payment_amount) / 100,
        status: qr.status,
        closeBy: qr.close_by,
        paymentsAmountReceived:
          (Number(qr.payments_amount_received) || 0) / 100,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Razorpay QR code creation failed: ${errorMessage}`);
      throw new BadRequestException(
        `Razorpay Dynamic QR generation error: ${errorMessage}. Please ensure Razorpay Smart Collect / UPI QR is enabled on your Razorpay dashboard.`,
      );
    }
  }

  /**
   * Fetches real-time status of a Razorpay Dynamic QR code to confirm payment.
   */
  async fetchQrStatus(qrId: string) {
    const razorpay = await this.getRazorpayClient();
    try {
      const qr: any = await razorpay.qrCode.fetch(qrId);
      const amountDue = (Number(qr.payment_amount) || 0) / 100;
      const amountReceived = (Number(qr.payments_amount_received) || 0) / 100;
      const isPaid = amountReceived >= amountDue && amountDue > 0;

      return {
        qrId: qr.id,
        status: isPaid ? 'PAID' : qr.status,
        isPaid,
        amountDue,
        amountReceived,
        closeBy: qr.close_by,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to fetch Razorpay QR status for ${qrId}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to check Razorpay QR status: ${errorMessage}`,
      );
    }
  }

  /**
   * Directly queries Razorpay API to check live payment/order status and syncs DB.
   */
  async syncGatewayStatus(id: string, userId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    }

    if (!payment.providerOrderId) {
      return {
        payment: this.toResponse(payment, true),
        synced: false,
        message: 'No Razorpay Order ID on payment record',
      };
    }

    const razorpay = await this.getRazorpayClient();
    try {
      const rzpOrder: any = await razorpay.orders.fetch(payment.providerOrderId);
      const rzpPayments: any = await razorpay.orders.fetchPayments(
        payment.providerOrderId,
      );

      const capturedItem = (rzpPayments.items || []).find(
        (it: any) => it.status === 'captured',
      );

      if (capturedItem) {
        this.validateProviderPayment(payment, capturedItem);
        await this.orderWorkflowService.capturePayment(id, capturedItem.id, userId, capturedItem);
        const updated = await this.paymentRepository.findById(id);
        return { payment: this.toResponse(updated, true), synced: true, status: 'CAPTURED', message: 'Gateway payment received and order reconciled.' };
      }

      return {
        payment: this.toResponse(payment, true),
        synced: true,
        status: payment.status,
        razorpayOrderStatus: rzpOrder.status,
        message: `Razorpay reports order status as "${rzpOrder.status}". No captured payment yet.`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to sync live Razorpay gateway for payment ${id}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Razorpay Gateway Sync failed: ${errorMessage}`,
      );
    }
  }
}
