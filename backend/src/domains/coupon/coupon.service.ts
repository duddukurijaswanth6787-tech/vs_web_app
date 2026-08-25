import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CouponRepository } from './coupon.repository';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ApplyCouponDto,
  ValidateCouponDto,
  CouponQueryDto,
  CouponResponse,
  CouponApplyResponse,
  CouponType,
} from './coupon.types';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private toResponse(c: any): CouponResponse {
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

  async findAll(query: CouponQueryDto) {
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

  async findById(id: string) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) throw new BusinessException('Coupon not found', 'COUPON_001');
    return this.toResponse(coupon);
  }

  async getActiveCoupons() {
    const coupons = await this.couponRepository.findActiveCoupons();
    return coupons.map((c) => this.toResponse(c));
  }

  async create(userId: string, dto: CreateCouponDto) {
    const existing = await this.couponRepository.findByCode(dto.code);
    if (existing)
      throw new BusinessException('Coupon code already exists', 'COUPON_002');

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

  async update(id: string, dto: UpdateCouponDto, userId: string) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) throw new BusinessException('Coupon not found', 'COUPON_001');

    if (dto.code && dto.code !== coupon.code) {
      const existing = await this.couponRepository.findByCode(dto.code);
      if (existing)
        throw new BusinessException('Coupon code already exists', 'COUPON_002');
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

  private isItemApplicable(
    item: { productId: string; categoryId?: string; brandId?: string },
    coupon: { applicableTo?: string | null; applicableIds?: string[] },
  ): boolean {
    if (!coupon.applicableTo) return true;
    const ids: string[] = coupon.applicableIds ?? [];
    if (!ids.length) return true;
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

  /**
   * Validates a coupon against a customer + order amount and returns the
   * discount that would apply. Read-only — no usage is recorded, safe to
   * call repeatedly for cart/checkout preview.
   *
   * `items`, when passed, lets a coupon scoped to specific products/
   * categories/brands (applicableTo + applicableIds) discount only the
   * matching portion of the cart instead of the full order amount. A
   * scoped coupon with no matching items in the cart is rejected rather
   * than silently discounting everything.
   */
  async checkCoupon(
    userId: string,
    code: string,
    orderAmount: number,
    items: {
      productId: string;
      categoryId?: string;
      brandId?: string;
      price: number;
      quantity: number;
    }[] = [],
    client?: Prisma.TransactionClient,
  ) {
    const coupon = await this.couponRepository.findByCode(
      code.trim().toUpperCase(),
      client,
    );
    if (!coupon) throw new BusinessException('Coupon not found', 'COUPON_001');
    if (!coupon.isActive)
      throw new BusinessException('Coupon is inactive', 'COUPON_003');

    const now = new Date();
    if (now < coupon.startDate)
      throw new BusinessException('Coupon is not yet active', 'COUPON_004');
    if (now > coupon.endDate)
      throw new BusinessException('Coupon has expired', 'COUPON_005');

    if (coupon.usageLimit) {
      const totalUsage = await this.couponRepository.getUsageCount(
        coupon.id,
        undefined,
        client,
      );
      if (totalUsage >= coupon.usageLimit)
        throw new BusinessException('Coupon usage limit reached', 'COUPON_006');
    }

    const customerUsage = await this.couponRepository.getUsageCount(
      coupon.id,
      userId,
      client,
    );
    if (customerUsage >= coupon.perCustomerLimit)
      throw new BusinessException(
        'Per-customer usage limit reached',
        'COUPON_007',
      );

    let applicableAmount = orderAmount;
    if (coupon.applicableTo) {
      applicableAmount = items
        .filter((item) => this.isItemApplicable(item, coupon))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (applicableAmount <= 0) {
        throw new BusinessException(
          'This coupon does not apply to any items in your cart',
          'COUPON_009',
        );
      }
    }

    if (
      coupon.minOrderAmount &&
      applicableAmount < Number(coupon.minOrderAmount)
    ) {
      throw new BusinessException(
        'Order amount does not meet minimum requirement',
        'COUPON_008',
      );
    }

    let discountAmount = 0;
    const freeShipping = coupon.type === CouponType.FREE_SHIPPING;
    if (freeShipping) {
      discountAmount = 0;
    } else if (coupon.type === CouponType.FLAT) {
      discountAmount = Number(coupon.value);
    } else {
      discountAmount = (applicableAmount * Number(coupon.value)) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.maxDiscountAmount),
        );
      }
    }

    return { coupon, discountAmount, freeShipping };
  }

  async validateCoupon(userId: string, dto: ValidateCouponDto) {
    const { coupon, discountAmount, freeShipping } = await this.checkCoupon(
      userId,
      dto.code,
      dto.orderAmount,
      dto.items,
    );
    return {
      couponId: coupon.id,
      code: coupon.code,
      discountAmount,
      freeShipping,
      message: 'Coupon is valid',
    };
  }

  async applyCoupon(
    userId: string,
    dto: ApplyCouponDto,
  ): Promise<CouponApplyResponse> {
    // Lock the coupon row for the whole check-then-record sequence so two
    // concurrent redemptions of the same coupon can't both read the
    // pre-increment usage count and both pass the usage-limit check.
    const { coupon, discountAmount, freeShipping } =
      await this.prisma.$transaction(async (tx) => {
        await this.couponRepository.lockCouponByCode(
          dto.code.trim().toUpperCase(),
          tx,
        );
        const checked = await this.checkCoupon(
          userId,
          dto.code,
          dto.orderAmount,
          dto.items,
          tx,
        );

        await this.couponRepository.createUsage(
          {
            coupon: { connect: { id: checked.coupon.id } },
            orderId: dto.orderId,
            customerId: userId,
            discountAmount: checked.discountAmount,
          },
          tx,
        );

        await this.couponRepository.update(
          checked.coupon.id,
          { usedCount: { increment: 1 } },
          tx,
        );

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
}
