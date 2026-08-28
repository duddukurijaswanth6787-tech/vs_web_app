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
exports.CouponRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CouponRepository = class CouponRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, isActive, type, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        if (type)
            where.type = type;
        const [data, total] = await Promise.all([
            this.prisma.coupon.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.coupon.count({ where }),
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
        return this.prisma.coupon.findUnique({ where: { id } });
    }
    async findByCode(code, client = this.prisma) {
        return client.coupon.findUnique({ where: { code } });
    }
    async lockCouponByCode(code, tx) {
        await tx.$queryRaw `SELECT id FROM "coupons" WHERE code = ${code} FOR UPDATE`;
    }
    async findActiveCoupons() {
        const now = new Date();
        return this.prisma.coupon.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.coupon.create({ data });
    }
    async update(id, data, client = this.prisma) {
        return client.coupon.update({ where: { id }, data });
    }
    async createUsage(data, client = this.prisma) {
        return client.couponUsage.create({ data });
    }
    async getUsageCount(couponId, customerId, client = this.prisma) {
        const where = { couponId };
        if (customerId)
            where.customerId = customerId;
        return client.couponUsage.count({ where });
    }
};
exports.CouponRepository = CouponRepository;
exports.CouponRepository = CouponRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CouponRepository);
//# sourceMappingURL=coupon.repository.js.map