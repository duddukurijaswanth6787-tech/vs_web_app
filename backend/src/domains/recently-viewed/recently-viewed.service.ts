import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { TrackViewDto, RecentlyViewedQueryDto } from './recently-viewed.types';

@Injectable()
export class RecentlyViewedService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    return profile;
  }

  async track(userId: string, dto: TrackViewDto) {
    const profile = await this.getProfile(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
    });
    if (!product)
      throw new BusinessException('Product not found', 'PRODUCT_001');

    const item = await this.prisma.recentlyViewedProduct.upsert({
      where: {
        customerId_productId: {
          customerId: profile.id,
          productId: dto.productId,
        },
      },
      create: { customerId: profile.id, productId: dto.productId },
      update: { viewedAt: new Date() },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
          },
        },
      },
    });

    // Keep only latest 50
    const extras = await this.prisma.recentlyViewedProduct.findMany({
      where: { customerId: profile.id },
      orderBy: { viewedAt: 'desc' },
      skip: 50,
      select: { id: true },
    });
    if (extras.length) {
      await this.prisma.recentlyViewedProduct.deleteMany({
        where: { id: { in: extras.map((e) => e.id) } },
      });
    }
    return item;
  }

  async list(userId: string, query: RecentlyViewedQueryDto) {
    const profile = await this.getProfile(userId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const [data, total] = await Promise.all([
      this.prisma.recentlyViewedProduct.findMany({
        where: { customerId: profile.id },
        orderBy: { viewedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.recentlyViewedProduct.count({
        where: { customerId: profile.id },
      }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  async clear(userId: string) {
    const profile = await this.getProfile(userId);
    await this.prisma.recentlyViewedProduct.deleteMany({
      where: { customerId: profile.id },
    });
    return { cleared: true };
  }
}
