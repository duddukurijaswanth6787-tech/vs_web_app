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
exports.NotificationRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let NotificationRepository = class NotificationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { userId, type, isRead, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (type)
            where.type = type;
        if (isRead !== undefined)
            where.isRead = isRead;
        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id) {
        return this.prisma.notification.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.notification.create({ data });
    }
    async update(id, data) {
        return this.prisma.notification.update({ where: { id }, data });
    }
    async markAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({ where: { userId, isRead: false } });
    }
    async deleteAllRead(userId) {
        const { count } = await this.prisma.notification.deleteMany({
            where: { userId, isRead: true },
        });
        return count;
    }
    async getStats(userId) {
        const [total, unread, read, archived] = await Promise.all([
            this.prisma.notification.count({ where: { userId } }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
            this.prisma.notification.count({
                where: { userId, isRead: true, isArchived: false },
            }),
            this.prisma.notification.count({ where: { userId, isArchived: true } }),
        ]);
        return { total, unread, read, archived };
    }
};
exports.NotificationRepository = NotificationRepository;
exports.NotificationRepository = NotificationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationRepository);
//# sourceMappingURL=notification.repository.js.map