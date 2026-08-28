"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
let SmsService = SmsService_1 = class SmsService {
    prisma;
    configService;
    auditService;
    logger = new common_1.Logger(SmsService_1.name);
    constructor(prisma, configService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
    }
    isEnabled() {
        return this.configService.get('app.features.sms', false);
    }
    async send(dto, actorId) {
        const log = await this.prisma.smsLog.create({
            data: {
                userId: dto.userId,
                phone: dto.phone,
                template: dto.template,
                message: dto.message,
                status: 'PENDING',
            },
        });
        if (!this.isEnabled()) {
            const updated = await this.prisma.smsLog.update({
                where: { id: log.id },
                data: {
                    status: 'MOCK_SENT',
                    providerRef: `mock_${log.id.slice(0, 8)}`,
                    metadata: {
                        note: 'SMS disabled; mocked as sent. Set ENABLE_SMS=true and provider credentials for live send.',
                    },
                },
            });
            this.logger.warn(`SMS mocked (disabled): ${dto.phone} / ${dto.template}`);
            return updated;
        }
        const apiKey = this.configService.get('app.sms.apiKey', '');
        const provider = this.configService.get('app.sms.provider', 'mock');
        try {
            if (!apiKey || provider === 'mock') {
                const updated = await this.prisma.smsLog.update({
                    where: { id: log.id },
                    data: { status: 'MOCK_SENT', providerRef: `mock_${Date.now()}` },
                });
                return updated;
            }
            const updated = await this.prisma.smsLog.update({
                where: { id: log.id },
                data: { status: 'SENT', providerRef: `${provider}_${Date.now()}` },
            });
            await this.auditService.log({
                action: 'SMS_SENT',
                module: 'sms',
                resource: 'sms_log',
                resourceId: updated.id,
                userId: actorId,
                newValue: { phone: dto.phone, template: dto.template },
            });
            return updated;
        }
        catch (err) {
            return this.prisma.smsLog.update({
                where: { id: log.id },
                data: { status: 'FAILED', error: err?.message ?? 'SMS send failed' },
            });
        }
    }
    async sendOrderSms(dto, actorId) {
        const order = await this.prisma.order.findFirst({
            where: { id: dto.orderId, deletedAt: null },
            include: {
                customer: { include: { user: true } },
                addresses: true,
            },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        const phone = order.addresses?.[0]?.phone ||
            order.customer.phone ||
            order.customer.user.phone;
        if (!phone)
            throw new exceptions_1.BusinessException('Customer phone not found', 'SMS_001');
        const template = dto.template ?? 'ORDER_CONFIRMED';
        const message = `Vasanthi Designers: Your order ${order.orderNumber} status update (${template}). Thank you!`;
        return this.send({
            phone: phone.replace(/\D/g, '').slice(-10),
            template,
            message,
            userId: order.customer.userId,
        }, actorId);
    }
    async sendOtpSms(phone, code, userId) {
        return this.send({
            phone,
            template: 'OTP',
            message: `Your Vasanthi Designers OTP is ${code}. Do not share it.`,
            userId,
        });
    }
    async listLogs(page = 1, limit = 20) {
        const take = Math.min(limit, 100);
        const [data, total] = await Promise.all([
            this.prisma.smsLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
            }),
            this.prisma.smsLog.count(),
        ]);
        return { data, meta: { page, limit: take, total } };
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], SmsService);
//# sourceMappingURL=sms.service.js.map