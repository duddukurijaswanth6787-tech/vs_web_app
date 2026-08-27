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
exports.OrderRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let OrderRepository = class OrderRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, status, customerId, startDate, endDate, page, limit, sortBy, sortOrder, } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        if (customerId)
            where.customerId = customerId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.order.count({ where }),
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
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                addresses: true,
                timeline: { orderBy: { createdAt: 'desc' } },
            },
        });
    }
    async findByOrderNumber(orderNumber) {
        return this.prisma.order.findUnique({
            where: { orderNumber },
            include: {
                items: true,
                addresses: true,
                timeline: { orderBy: { createdAt: 'desc' } },
            },
        });
    }
    async findByCustomerId(customerId, page, limit) {
        const skip = (page - 1) * limit;
        const where = { customerId };
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
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
    async create(data) {
        return this.prisma.order.create({
            data,
            include: { items: true, addresses: true },
        });
    }
    async update(id, data) {
        return this.prisma.order.update({ where: { id }, data });
    }
    async createTimeline(orderId, status, message, createdBy, metadata) {
        return this.prisma.orderTimeline.create({
            data: { orderId, status, message, createdBy, metadata },
        });
    }
    async updateStatus(orderId, status, userId) {
        const [order] = await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: orderId },
                data: { status },
            }),
            this.prisma.orderTimeline.create({
                data: {
                    orderId,
                    status,
                    message: `Status changed to ${status}`,
                    createdBy: userId,
                },
            }),
        ]);
        return order;
    }
};
exports.OrderRepository = OrderRepository;
exports.OrderRepository = OrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderRepository);
//# sourceMappingURL=order.repository.js.map