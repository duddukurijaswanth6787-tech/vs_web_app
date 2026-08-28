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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const notification_repository_1 = require("./notification.repository");
let NotificationService = class NotificationService {
    notificationRepository;
    auditService;
    constructor(notificationRepository, auditService) {
        this.notificationRepository = notificationRepository;
        this.auditService = auditService;
    }
    toResponse(n) {
        return {
            id: n.id,
            userId: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data ?? undefined,
            isRead: n.isRead,
            isArchived: n.isArchived,
            readAt: n.readAt ?? undefined,
            createdAt: n.createdAt,
        };
    }
    async findAll(userId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.notificationRepository.findAll({
            userId,
            type: query.type,
            isRead: query.isRead,
            page,
            limit,
        });
        return {
            data: result.data.map((n) => this.toResponse(n)),
            meta: result.meta,
        };
    }
    async findById(id, userId) {
        const notification = await this.notificationRepository.findById(id);
        if (!notification || notification.userId !== userId)
            throw new exceptions_1.BusinessException('Notification not found', 'NOTIFICATION_001');
        return this.toResponse(notification);
    }
    async create(dto) {
        const notification = await this.notificationRepository.create({
            user: { connect: { id: dto.userId } },
            type: dto.type,
            title: dto.title,
            message: dto.message,
            data: dto.data,
        });
        await this.auditService.log({
            action: 'NOTIFICATION_CREATED',
            module: 'notification',
            resource: 'notification',
            resourceId: notification.id,
            userId: dto.userId,
        });
        return this.toResponse(notification);
    }
    async markAsRead(id, userId) {
        const notification = await this.notificationRepository.findById(id);
        if (!notification || notification.userId !== userId)
            throw new exceptions_1.BusinessException('Notification not found', 'NOTIFICATION_001');
        await this.notificationRepository.markAsRead(id);
        const updated = await this.notificationRepository.findById(id);
        return this.toResponse(updated);
    }
    async markAllAsRead(userId) {
        await this.notificationRepository.markAllAsRead(userId);
    }
    async archive(id, userId) {
        const notification = await this.notificationRepository.findById(id);
        if (!notification || notification.userId !== userId)
            throw new exceptions_1.BusinessException('Notification not found', 'NOTIFICATION_001');
        await this.notificationRepository.update(id, { isArchived: true });
        const updated = await this.notificationRepository.findById(id);
        return this.toResponse(updated);
    }
    async delete(id, userId) {
        const notification = await this.notificationRepository.findById(id);
        if (!notification || notification.userId !== userId)
            throw new exceptions_1.BusinessException('Notification not found', 'NOTIFICATION_001');
        await this.notificationRepository.update(id, { isArchived: true });
    }
    async getUnreadCount(userId) {
        return this.notificationRepository.getUnreadCount(userId);
    }
    async deleteAllRead(userId) {
        return this.notificationRepository.deleteAllRead(userId);
    }
    async getStats(userId) {
        return this.notificationRepository.getStats(userId);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_repository_1.NotificationRepository,
        audit_service_1.AuditService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map