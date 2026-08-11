import { Injectable } from '@nestjs/common';
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

  /**
   * Validates a coupon against a customer + order amount and returns the
   * discount that would apply. Read-only — no usage is recorded, safe to
   * call repeatedly for cart/checkout preview.
   */
  async checkCoupon(userId: string, code: string, orderAmount: number) {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) throw new BusinessException('Coupon not found', 'COUPON_001');
    if (!coupon.isActive)
      throw new BusinessException('Coupon is inactive', 'COUPON_003');

    const now = new Date();
    if (now < coupon.startDate)
      throw new BusinessException('Coupon is not yet active', 'COUPON_004');
    if (now > coupon.endDate)
      throw new BusinessException('Coupon has expired', 'COUPON_005');

    if (coupon.usageLimit) {
      const totalUsage = await this.couponRepository.getUsageCount(coupon.id);
      if (totalUsage >= coupon.usageLimit)
        throw new BusinessException('Coupon usage limit reached', 'COUPON_006');
    }

    const customerUsage = await this.couponRepository.getUsageCount(
      coupon.id,
      userId,
    );
    if (customerUsage >= coupon.perCustomerLimit)
      throw new BusinessException(
        'Per-customer usage limit reached',
        'COUPON_007',
      );

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BusinessException(
        'Order amount does not meet minimum requirement',
        'COUPON_008',
      );
    }

    let discountAmount: number;
    if (coupon.type === CouponType.FREE_SHIPPING) {
      discountAmount = 0;
    } else if (coupon.type === CouponType.FLAT) {
      discountAmount = Number(coupon.value);
    } else {
      discountAmount = (orderAmount * Number(coupon.value)) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.maxDiscountAmount),
        );
      }
    }

    return { coupon, discountAmount };
  }

  async validateCoupon(userId: string, dto: ValidateCouponDto) {
    const { coupon, discountAmount } = await this.checkCoupon(
      userId,
      dto.code,
      dto.orderAmount,
    );
    return {
      couponId: coupon.id,
      code: coupon.code,
      discountAmount,
      message: 'Coupon is valid',
    };
  }

  async applyCoupon(
    userId: string,
    dto: ApplyCouponDto,
  ): Promise<CouponApplyResponse> {
    const { coupon, discountAmount } = await this.checkCoupon(
      userId,
      dto.code,
      dto.orderAmount,
    );

    await this.couponRepository.createUsage({
      coupon: { connect: { id: coupon.id } },
      orderId: dto.orderId,
      customerId: userId,
      discountAmount,
    });

    await this.couponRepository.update(coupon.id, {
      usedCount: { increment: 1 },
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
      message: 'Coupon applied successfully',
    };
  }
}
