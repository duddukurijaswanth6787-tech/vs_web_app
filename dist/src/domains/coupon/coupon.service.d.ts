import { Prisma } from '@prisma/client';
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CouponRepository } from './coupon.repository';
import { CreateCouponDto, UpdateCouponDto, ApplyCouponDto, ValidateCouponDto, CouponQueryDto, CouponResponse, CouponApplyResponse } from './coupon.types';
export declare class CouponService {
    private readonly couponRepository;
    private readonly auditService;
    private readonly prisma;
    constructor(couponRepository: CouponRepository, auditService: AuditService, prisma: PrismaService);
    private toResponse;
    findAll(query: CouponQueryDto): Promise<{
        data: CouponResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<CouponResponse>;
    getActiveCoupons(): Promise<CouponResponse[]>;
    create(userId: string, dto: CreateCouponDto): Promise<CouponResponse>;
    update(id: string, dto: UpdateCouponDto, userId: string): Promise<CouponResponse>;
    private isItemApplicable;
    checkCoupon(userId: string, code: string, orderAmount: number, items?: {
        productId: string;
        categoryId?: string;
        brandId?: string;
        price: number;
        quantity: number;
    }[], client?: Prisma.TransactionClient): Promise<{
        coupon: {
            id: string;
            name: string;
            description: string | null;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            type: string;
            isActive: boolean;
            maxDiscountAmount: Prisma.Decimal | null;
            value: Prisma.Decimal;
            minOrderAmount: Prisma.Decimal | null;
            usageLimit: number | null;
            perCustomerLimit: number;
            usedCount: number;
            applicableTo: string | null;
            applicableIds: string[];
            startDate: Date;
            endDate: Date;
        };
        discountAmount: number;
        freeShipping: boolean;
    }>;
    validateCoupon(userId: string, dto: ValidateCouponDto): Promise<{
        couponId: string;
        code: string;
        discountAmount: number;
        freeShipping: boolean;
        message: string;
    }>;
    applyCoupon(userId: string, dto: ApplyCouponDto): Promise<CouponApplyResponse>;
}
