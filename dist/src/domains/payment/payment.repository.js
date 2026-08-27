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
exports.PaymentRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let PaymentRepository = class PaymentRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { orderId, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (orderId)
            where.orderId = orderId;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payment.count({ where }),
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
        return this.prisma.payment.findUnique({
            where: { id },
            include: { transactions: { orderBy: { createdAt: 'desc' } } },
        });
    }
    async findByOrderId(orderId) {
        return this.prisma.payment.findMany({
            where: { orderId },
            include: { transactions: { orderBy: { createdAt: 'desc' } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.payment.create({
            data,
            include: { transactions: true },
        });
    }
    async update(id, data) {
        return this.prisma.payment.update({ where: { id }, data });
    }
    async markCapturedIfNotAlready(id, data) {
        const result = await this.prisma.payment.updateMany({
            where: { id, status: { not: 'CAPTURED' } },
            data,
        });
        return result.count;
    }
    async createTransaction(data) {
        return this.prisma.paymentTransaction.create({ data });
    }
    async generatePaymentNumber() {
        const count = await this.prisma.payment.count();
        return `PAY${String(count + 1).padStart(8, '0')}`;
    }
};
exports.PaymentRepository = PaymentRepository;
exports.PaymentRepository = PaymentRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentRepository);
//# sourceMappingURL=payment.repository.js.map