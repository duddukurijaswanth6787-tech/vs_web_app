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
var PushNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
let PushNotificationService = PushNotificationService_1 = class PushNotificationService {
    prisma;
    configService;
    auditService;
    logger = new common_1.Logger(PushNotificationService_1.name);
    constructor(prisma, configService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
    }
    async registerDevice(userId, dto) {
        const device = await this.prisma.pushDevice.upsert({
            where: { token: dto.token },
            create: {
                userId,
                token: dto.token,
                platform: dto.platform ?? 'WEB',
                deviceName: dto.deviceName,
                isActive: true,
                lastUsedAt: new Date(),
            },
            update: {
                userId,
                platform: dto.platform ?? 'WEB',
                deviceName: dto.deviceName,
                isActive: true,
                lastUsedAt: new Date(),
            },
        });
        return device;
    }
    async unregisterDevice(userId, token) {
        const device = await this.prisma.pushDevice.findUnique({
            where: { token },
        });
        if (!device || device.userId !== userId) {
            throw new exceptions_1.BusinessException('Device not found', 'PUSH_001');
        }
        return this.prisma.pushDevice.update({
            where: { token },
            data: { isActive: false },
        });
    }
    async listMyDevices(userId) {
        return this.prisma.pushDevice.findMany({
            where: { userId, isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async send(dto, actorId) {
        const where = { isActive: true };
        if (dto.userId)
            where.userId = dto.userId;
        const devices = await this.prisma.pushDevice.findMany({ where });
        const log = await this.prisma.pushNotificationLog.create({
            data: {
                userId: dto.userId,
                title: dto.title,
                body: dto.body,
                data: dto.data ?? undefined,
                status: 'PENDING',
                targetCount: devices.length,
            },
        });
        const pushEnabled = this.configService.get('app.push.enabled', false);
        const serverKey = this.configService.get('app.push.serverKey', '');
        if (!pushEnabled || !serverKey || devices.length === 0) {
            const updated = await this.prisma.pushNotificationLog.update({
                where: { id: log.id },
                data: {
                    status: devices.length ? 'MOCK_SENT' : 'SKIPPED',
                    successCount: devices.length,
                },
            });
            this.logger.warn(`Push mocked/skipped: targets=${devices.length}`);
            return updated;
        }
        const updated = await this.prisma.pushNotificationLog.update({
            where: { id: log.id },
            data: { status: 'SENT', successCount: devices.length },
        });
        await this.auditService.log({
            action: 'PUSH_SENT',
            module: 'push-notification',
            resource: 'push_notification_log',
            resourceId: updated.id,
            userId: actorId,
            newValue: { title: dto.title, targetCount: devices.length },
        });
        return updated;
    }
    async listLogs(page = 1, limit = 20) {
        const take = Math.min(limit, 100);
        const [data, total] = await Promise.all([
            this.prisma.pushNotificationLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
            }),
            this.prisma.pushNotificationLog.count(),
        ]);
        return { data, meta: { page, limit: take, total } };
    }
};
exports.PushNotificationService = PushNotificationService;
exports.PushNotificationService = PushNotificationService = PushNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], PushNotificationService);
//# sourceMappingURL=push-notification.service.js.map