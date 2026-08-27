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
exports.CouponService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const coupon_repository_1 = require("./coupon.repository");
const coupon_types_1 = require("./coupon.types");
let CouponService = class CouponService {
    couponRepository;
    auditService;
    prisma;
    constructor(couponRepository, auditService, prisma) {
        this.couponRepository = couponRepository;
        this.auditService = auditService;
        this.prisma = prisma;
    }
    toResponse(c) {
        return {
            id: c.id,
            code: c.code,
            name: c.name,
            description: c.description ?? undefined,
            type: c.type,
            value: Number(c.value),
            minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : undefined,
            maxDiscountAmount: c.maxDiscountAmount
                ? Number(c.maxDiscountAmount)
                : undefined,
            usageLimit: c.usageLimit ?? undefined,
            perCustomerLimit: c.perCustomerLimit,
            usedCount: c.usedCount,
            applicableTo: c.applicableTo ?? undefined,
            applicableIds: c.applicableIds ?? undefined,
            startDate: c.startDate,
            endDate: c.endDate,
            isActive: c.isActive,
            createdAt: c.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.couponRepository.findAll({
            search: query.search,
            isActive: query.isActive,
            type: query.type,
            page,
            limit,
        });
        return {
            data: result.data.map((c) => this.toResponse(c)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const coupon = await this.couponRepository.findById(id);
        if (!coupon)
            throw new exceptions_1.BusinessException('Coupon not found', 'COUPON_001');
        return this.toResponse(coupon);
    }
    async getActiveCoupons() {
        const coupons = await this.couponRepository.findActiveCoupons();
        return coupons.map((c) => this.toResponse(c));
    }
    async create(userId, dto) {
        const existing = await this.couponRepository.findByCode(dto.code);
        if (existing)
            throw new exceptions_1.BusinessException('Coupon code already exists', 'COUPON_002');
        const coupon = await this.couponRepository.create({
            code: dto.code,
            name: dto.name,
            description: dto.description,
            type: dto.type,
            value: dto.value,
            minOrderAmount: dto.minOrderAmount,
            maxDiscountAmount: dto.maxDiscountAmount,
            usageLimit: dto.usageLimit,
            perCustomerLimit: dto.perCustomerLimit ?? 1,
            applicableTo: dto.applicableTo,
            applicableIds: dto.applicableIds ?? [],
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'COUPON_CREATED',
            module: 'coupon',
            resource: 'Coupon',
            resourceId: coupon.id,
            userId,
        });
        return this.toResponse(coupon);
    }
    async update(id, dto, userId) {
        const coupon = await this.couponRepository.findById(id);
        if (!coupon)
            throw new exceptions_1.BusinessException('Coupon not found', 'COUPON_001');
        if (dto.code && dto.code !== coupon.code) {
            const existing = await this.couponRepository.findByCode(dto.code);
            if (existing)
                throw new exceptions_1.BusinessException('Coupon code already exists', 'COUPON_002');
        }
        const updated = await this.couponRepository.update(id, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'COUPON_UPDATED',
            module: 'coupon',
            resource: 'Coupon',
            resourceId: id,
            userId,
        });
        return this.toResponse(updated);
    }
    isItemApplicable(item, coupon) {
        if (!coupon.applicableTo)
            return true;
        const ids = coupon.applicableIds ?? [];
        if (!ids.length)
            return true;
        switch (coupon.applicableTo) {
            case 'PRODUCT':
            case 'PRODUCTS':
                return ids.includes(item.productId);
            case 'CATEGORY':
            case 'CATEGORIES':
                return !!item.categoryId && ids.includes(item.categoryId);
            case 'BRAND':
            case 'BRANDS':
                return !!item.brandId && ids.includes(item.brandId);
            default:
                return true;
        }
    }
    async checkCoupon(userId, code, orderAmount, items = [], client) {
        const coupon = await this.couponRepository.findByCode(code.trim().toUpperCase(), client);
        if (!coupon)
            throw new exceptions_1.BusinessException('Coupon not found', 'COUPON_001');
        if (!coupon.isActive)
            throw new exceptions_1.BusinessException('Coupon is inactive', 'COUPON_003');
        const now = new Date();
        if (now < coupon.startDate)
            throw new exceptions_1.BusinessException('Coupon is not yet active', 'COUPON_004');
        if (now > coupon.endDate)
            throw new exceptions_1.BusinessException('Coupon has expired', 'COUPON_005');
        if (coupon.usageLimit) {
            const totalUsage = await this.couponRepository.getUsageCount(coupon.id, undefined, client);
            if (totalUsage >= coupon.usageLimit)
                throw new exceptions_1.BusinessException('Coupon usage limit reached', 'COUPON_006');
        }
        const customerUsage = await this.couponRepository.getUsageCount(coupon.id, userId, client);
        if (customerUsage >= coupon.perCustomerLimit)
            throw new exceptions_1.BusinessException('Per-customer usage limit reached', 'COUPON_007');
        let applicableAmount = orderAmount;
        if (coupon.applicableTo) {
            applicableAmount = items
                .filter((item) => this.isItemApplicable(item, coupon))
                .reduce((sum, item) => sum + item.price * item.quantity, 0);
            if (applicableAmount <= 0) {
                throw new exceptions_1.BusinessException('This coupon does not apply to any items in your cart', 'COUPON_009');
            }
        }
        if (coupon.minOrderAmount &&
            applicableAmount < Number(coupon.minOrderAmount)) {
            throw new exceptions_1.BusinessException('Order amount does not meet minimum requirement', 'COUPON_008');
        }
        let discountAmount = 0;
        const freeShipping = coupon.type === coupon_types_1.CouponType.FREE_SHIPPING;
        if (freeShipping) {
            discountAmount = 0;
        }
        else if (coupon.type === coupon_types_1.CouponType.FLAT) {
            discountAmount = Number(coupon.value);
        }
        else {
            discountAmount = (applicableAmount * Number(coupon.value)) / 100;
            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
            }
        }
        return { coupon, discountAmount, freeShipping };
    }
    async validateCoupon(userId, dto) {
        const { coupon, discountAmount, freeShipping } = await this.checkCoupon(userId, dto.code, dto.orderAmount, dto.items);
        return {
            couponId: coupon.id,
            code: coupon.code,
            discountAmount,
            freeShipping,
            message: 'Coupon is valid',
        };
    }
    async applyCoupon(userId, dto) {
        const { coupon, discountAmount, freeShipping } = await this.prisma.$transaction(async (tx) => {
            await this.couponRepository.lockCouponByCode(dto.code.trim().toUpperCase(), tx);
            const checked = await this.checkCoupon(userId, dto.code, dto.orderAmount, dto.items, tx);
            await this.couponRepository.createUsage({
                coupon: { connect: { id: checked.coupon.id } },
                orderId: dto.orderId,
                customerId: userId,
                discountAmount: checked.discountAmount,
            }, tx);
            await this.couponRepository.update(checked.coupon.id, { usedCount: { increment: 1 } }, tx);
            return checked;
        });
        await this.auditService.log({
            action: 'COUPON_APPLIED',
            module: 'coupon',
            resource: 'Coupon',
            resourceId: coupon.id,
            userId,
        });
        return {
            couponId: coupon.id,
            code: coupon.code,
            discountAmount,
            freeShipping,
            message: 'Coupon applied successfully',
        };
    }
};
exports.CouponService = CouponService;
exports.CouponService = CouponService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [coupon_repository_1.CouponRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService])
], CouponService);
//# sourceMappingURL=coupon.service.js.map