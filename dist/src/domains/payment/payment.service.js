"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const order_workflow_service_1 = require("../order/order-workflow.service");
const app_setting_repository_1 = require("../app-setting/app-setting.repository");
const payment_repository_1 = require("./payment.repository");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
const VALID_TRANSITIONS = {
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
let PaymentService = class PaymentService {
    paymentRepository;
    auditService;
    orderWorkflowService;
    configService;
    prisma;
    settingRepository;
    constructor(paymentRepository, auditService, orderWorkflowService, configService, prisma, settingRepository) {
        this.paymentRepository = paymentRepository;
        this.auditService = auditService;
        this.orderWorkflowService = orderWorkflowService;
        this.configService = configService;
        this.prisma = prisma;
        this.settingRepository = settingRepository;
    }
    async getEffectiveKeyId() {
        const dbValue = await this.settingRepository.getByKey(KEYS.keyId);
        return dbValue || this.configService.get('app.razorpay.keyId', '');
    }
    async getEffectiveKeySecret() {
        const dbValue = await this.settingRepository.getByKey(KEYS.keySecret);
        return dbValue || this.configService.get('app.razorpay.keySecret', '');
    }
    async getEffectiveWebhookSecret() {
        const dbValue = await this.settingRepository.getByKey(KEYS.webhookSecret);
        return dbValue || this.configService.get('app.razorpay.webhookSecret', '');
    }
    async getConfig() {
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
    async updateConfig(dto, userId) {
        const upsert = async (key, value, description) => {
            const existing = await this.settingRepository.findByKey(key);
            if (existing) {
                await this.settingRepository.update(existing.id, { value });
            }
            else {
                await this.settingRepository.create({ key, value, group: GROUP, description });
            }
        };
        if (dto.keyId !== undefined) {
            await upsert(KEYS.keyId, dto.keyId, 'Razorpay Key ID (public, safe to expose to frontend)');
        }
        if (dto.keySecret !== undefined) {
            await upsert(KEYS.keySecret, dto.keySecret, 'Razorpay Key Secret (private)');
        }
        if (dto.webhookSecret !== undefined) {
            await upsert(KEYS.webhookSecret, dto.webhookSecret, 'Razorpay Webhook Secret (private)');
        }
        await this.auditService.log({
            action: 'RAZORPAY_CONFIG_UPDATED',
            module: 'payment',
            resource: 'app_setting',
            userId,
            newValue: {
                keyId: dto.keyId,
                keySecret: dto.keySecret !== undefined ? '[redacted]' : undefined,
                webhookSecret: dto.webhookSecret !== undefined ? '[redacted]' : undefined,
            },
        });
        return this.getConfig();
    }
    async isRazorpayEnabled() {
        const enabled = this.configService.get('app.razorpay.enabled', true);
        const [keyId, keySecret] = await Promise.all([this.getEffectiveKeyId(), this.getEffectiveKeySecret()]);
        return enabled && !!keyId && !!keySecret;
    }
    async getRazorpayClient() {
        const [keyId, keySecret] = await Promise.all([this.getEffectiveKeyId(), this.getEffectiveKeySecret()]);
        return new razorpay_1.default({ key_id: keyId || 'mock_key', key_secret: keySecret || 'mock_secret' });
    }
    toResponse(p, includeTransactions = false) {
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
            transactions: includeTransactions && p.transactions
                ? p.transactions.map((t) => ({
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
    async findAll(query) {
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
    async findById(id) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment)
            throw new exceptions_1.BusinessException('Payment not found', 'PAYMENT_001');
        return this.toResponse(payment, true);
    }
    async findByOrderId(orderId) {
        const payments = await this.paymentRepository.findByOrderId(orderId);
        return payments.map((p) => this.toResponse(p, true));
    }
    async create(userId, dto) {
        const paymentNumber = await this.paymentRepository.generatePaymentNumber();
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
        });
        if (!order) {
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        }
        let providerOrderId = `rzp_mock_${paymentNumber}`;
        if (await this.isRazorpayEnabled()) {
            try {
                const razorpay = await this.getRazorpayClient();
                const razorpayOrder = await razorpay.orders.create({
                    amount: Math.round(dto.amount * 100),
                    currency: dto.currency || 'INR',
                    receipt: paymentNumber,
                });
                providerOrderId = razorpayOrder.id;
            }
            catch (err) {
                throw new exceptions_1.BusinessException(`Razorpay order creation failed: ${err.message || err}`, 'PAYMENT_006');
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
    async verifyPayment(id, razorpayPaymentId, razorpaySignature, userId) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment) {
            throw new exceptions_1.BusinessException('Payment not found', 'PAYMENT_001');
        }
        if (payment.status === 'CAPTURED') {
            return this.toResponse(payment, true);
        }
        const orderId = payment.providerOrderId;
        if (!orderId) {
            throw new exceptions_1.BusinessException('No provider order ID found on payment record', 'PAYMENT_004');
        }
        if (await this.isRazorpayEnabled()) {
            const keySecret = await this.getEffectiveKeySecret();
            const text = `${orderId}|${razorpayPaymentId}`;
            const generated = crypto
                .createHmac('sha256', keySecret)
                .update(text)
                .digest('hex');
            const genBuf = Buffer.from(generated);
            const sigBuf = Buffer.from(razorpaySignature);
            const isValid = genBuf.length === sigBuf.length &&
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
                throw new exceptions_1.BusinessException('Payment signature verification failed', 'PAYMENT_005');
            }
        }
        const capturedCount = await this.paymentRepository.markCapturedIfNotAlready(id, {
            status: 'CAPTURED',
            providerPaymentId: razorpayPaymentId,
            metadata: { razorpayPaymentId, razorpaySignature },
        });
        if (capturedCount === 0) {
            const current = await this.paymentRepository.findById(id);
            return this.toResponse(current, true);
        }
        const updated = await this.paymentRepository.findById(id);
        await this.paymentRepository.createTransaction({
            payment: { connect: { id } },
            type: 'CAPTURED',
            status: 'SUCCESS',
            amount: payment.amount,
            providerRefId: razorpayPaymentId,
        });
        await this.orderWorkflowService.transition(payment.orderId, 'CONFIRMED', userId, 'Payment verified successfully');
        try {
            await this.orderWorkflowService.deductInventory(payment.orderId, userId);
        }
        catch (err) {
            await this.orderWorkflowService.transition(payment.orderId, 'CANCELLED', userId, 'Auto-cancelled: insufficient stock after payment capture -- refund required');
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
    async refundPayment(paymentId, amount) {
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
            throw new exceptions_1.BusinessException('Payment not found', 'PAYMENT_001');
        }
        if (!payment.providerPaymentId) {
            throw new exceptions_1.BusinessException('This payment has no captured provider payment ID to refund', 'PAYMENT_007');
        }
        if (!(await this.isRazorpayEnabled())) {
            return { razorpayRefundId: `rfnd_mock_${Date.now()}`, status: 'processed' };
        }
        try {
            const razorpay = await this.getRazorpayClient();
            const refund = await razorpay.payments.refund(payment.providerPaymentId, {
                amount: Math.round(amount * 100),
            });
            return { razorpayRefundId: refund.id, status: refund.status };
        }
        catch (err) {
            throw new exceptions_1.BusinessException(`Razorpay refund failed: ${err.message || err}`, 'PAYMENT_008');
        }
    }
    async handleWebhook(rawBody, signature) {
        if (await this.isRazorpayEnabled()) {
            const webhookSecret = await this.getEffectiveWebhookSecret();
            if (!webhookSecret) {
                throw new exceptions_1.BusinessException('Webhook secret not configured', 'PAYMENT_WEBHOOK_002');
            }
            const generated = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            const genBuf = Buffer.from(generated);
            const sigBuf = Buffer.from(signature);
            const isValid = genBuf.length === sigBuf.length &&
                crypto.timingSafeEqual(genBuf, sigBuf);
            if (!isValid) {
                throw new exceptions_1.BusinessException('Webhook signature verification failed', 'PAYMENT_WEBHOOK_001');
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
            const capturedCount = await this.paymentRepository.markCapturedIfNotAlready(payment.id, { status: 'CAPTURED', providerPaymentId, metadata: paymentEntity });
            if (capturedCount === 0) {
                return { status: 'ignored', reason: 'Already captured' };
            }
            await this.paymentRepository.createTransaction({
                payment: { connect: { id: payment.id } },
                type: 'CAPTURED',
                status: 'SUCCESS',
                amount: payment.amount,
                providerRefId: providerPaymentId,
            });
            await this.orderWorkflowService.transition(payment.orderId, 'CONFIRMED', payment.createdBy || 'SYSTEM', 'Payment captured via webhook');
            try {
                await this.orderWorkflowService.deductInventory(payment.orderId, payment.createdBy || 'SYSTEM');
            }
            catch (err) {
                await this.orderWorkflowService.transition(payment.orderId, 'CANCELLED', payment.createdBy || 'SYSTEM', 'Auto-cancelled: insufficient stock after payment capture -- refund required');
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
    async updateStatus(id, status, userId) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment)
            throw new exceptions_1.BusinessException('Payment not found', 'PAYMENT_001');
        const allowed = VALID_TRANSITIONS[payment.status];
        if (!allowed?.includes(status)) {
            throw new exceptions_1.BusinessException(`Cannot transition from ${payment.status} to ${status}`, 'PAYMENT_002');
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
        const auditActions = {
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
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_repository_1.PaymentRepository,
        audit_service_1.AuditService,
        order_workflow_service_1.OrderWorkflowService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        app_setting_repository_1.AppSettingRepository])
], PaymentService);
//# sourceMappingURL=payment.service.js.map