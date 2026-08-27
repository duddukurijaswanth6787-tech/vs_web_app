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
exports.RefundRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RefundRepository = class RefundRepository {
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
            this.prisma.refund.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.refund.count({ where }),
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
        return this.prisma.refund.findUnique({ where: { id } });
    }
    async findByOrderId(orderId) {
        return this.prisma.refund.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.refund.create({ data });
    }
    async update(id, data) {
        return this.prisma.refund.update({ where: { id }, data });
    }
    async findPaymentById(paymentId) {
        return this.prisma.payment.findUnique({ where: { id: paymentId } });
    }
    async generateRefundNumber() {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `REF-${dateStr}-`;
        const lastRefund = await this.prisma.refund.findFirst({
            where: { refundNumber: { startsWith: prefix } },
            orderBy: { refundNumber: 'desc' },
            select: { refundNumber: true },
        });
        let seq = 1;
        if (lastRefund) {
            const lastSeq = parseInt(lastRefund.refundNumber.slice(-6), 10);
            if (!isNaN(lastSeq))
                seq = lastSeq + 1;
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }
};
exports.RefundRepository = RefundRepository;
exports.RefundRepository = RefundRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RefundRepository);
//# sourceMappingURL=refund.repository.js.map