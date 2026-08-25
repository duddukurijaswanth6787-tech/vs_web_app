import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    isActive?: boolean;
    type?: string;
    page: number;
    limit: number;
  }) {
    const { search, isActive, type, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CouponWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (type) where.type = type;

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

  async findById(id: string) {
    return this.prisma.coupon.findUnique({ where: { id } });
  }

  async findByCode(code: string, client: Prisma.TransactionClient = this.prisma) {
    return client.coupon.findUnique({ where: { code } });
  }

  /**
   * Locks the coupon row for the duration of the caller's transaction, so
   * concurrent applyCoupon calls for the same coupon serialize instead of
   * both reading the pre-increment usage count and passing the limit check.
   */
  async lockCouponByCode(code: string, tx: Prisma.TransactionClient) {
    await tx.$queryRaw`SELECT id FROM "coupons" WHERE code = ${code} FOR UPDATE`;
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

  async create(data: Prisma.CouponCreateInput) {
    return this.prisma.coupon.create({ data });
  }

  async update(
    id: string,
    data: Prisma.CouponUpdateInput,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.coupon.update({ where: { id }, data });
  }

  async createUsage(
    data: Prisma.CouponUsageCreateInput,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.couponUsage.create({ data });
  }

  async getUsageCount(
    couponId: string,
    customerId?: string,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const where: Prisma.CouponUsageWhereInput = { couponId };
    if (customerId) where.customerId = customerId;
    return client.couponUsage.count({ where });
  }
}
