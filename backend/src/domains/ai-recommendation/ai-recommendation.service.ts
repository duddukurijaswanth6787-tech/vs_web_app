import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { AiRecommendationRepository } from './ai-recommendation.repository';
import {
  RecommendationQueryDto,
  RecommendationResponse,
  RecommendationType,
  RecommendationHistoryQueryDto,
} from './ai-recommendation.types';

@Injectable()
export class AiRecommendationService {
  constructor(
    private readonly repository: AiRecommendationRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private toResponse(r: any): RecommendationResponse {
    return {
      id: r.id,
      productId: r.productId,
      score: Number(r.score),
      reason: r.reason ?? undefined,
      type: r.type as RecommendationType,
      createdAt: r.createdAt,
    };
  }

  private async getCustomerProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    }
    return profile;
  }

  async getRecommendations(userId: string, query: RecommendationQueryDto) {
    const profile = await this.getCustomerProfile(userId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.repository.findByCustomer(
      profile.id,
      query.type,
      page,
      limit,
    );

    // Auto-generate if empty so first call still returns useful data
    if (!result.data.length) {
      await this.generateRecommendations(userId);
      const refreshed = await this.repository.findByCustomer(
        profile.id,
        query.type,
        page,
        limit,
      );
      return {
        data: refreshed.data.map((r: any) => this.toResponse(r)),
        meta: refreshed.meta,
      };
    }

    return {
      data: result.data.map((r: any) => this.toResponse(r)),
      meta: result.meta,
    };
  }

  async generateRecommendations(userId: string) {
    const profile = await this.getCustomerProfile(userId);

    const [wishlistItems, recentOrders, recentlyViewed, bestsellers, featured] =
      await Promise.all([
        this.prisma.wishlistItem.findMany({
          where: { wishlist: { customerId: profile.id } },
          take: 20,
          select: { productId: true },
        }),
        this.prisma.orderItem.findMany({
          where: { order: { customerId: profile.id, deletedAt: null } },
          take: 30,
          orderBy: { createdAt: 'desc' },
          select: { productId: true },
        }),
        this.prisma.recentlyViewedProduct.findMany({
          where: { customerId: profile.id },
          take: 20,
          orderBy: { viewedAt: 'desc' },
          select: { productId: true },
        }),
        this.prisma.product.findMany({
          where: {
            deletedAt: null,
            isPublished: true,
            visibility: 'VISIBLE',
            isBestSeller: true,
          },
          take: 12,
          select: { id: true },
        }),
        this.prisma.product.findMany({
          where: {
            deletedAt: null,
            isPublished: true,
            visibility: 'VISIBLE',
            OR: [{ isFeatured: true }, { isNewArrival: true }],
          },
          take: 12,
          select: { id: true },
        }),
      ]);

    const scored = new Map<
      string,
      { score: number; reason: string; type: RecommendationType }
    >();

    const bump = (
      productId: string,
      score: number,
      reason: string,
      type: RecommendationType,
    ) => {
      const existing = scored.get(productId);
      if (!existing || score > existing.score) {
        scored.set(productId, { score, reason, type });
      } else {
        existing.score += score * 0.25;
      }
    };

    for (const item of wishlistItems) {
      bump(
        item.productId,
        90,
        'Based on your wishlist',
        RecommendationType.WISHLIST_BASED,
      );
    }
    for (const item of recentOrders) {
      bump(
        item.productId,
        80,
        'Because you purchased similar styles',
        RecommendationType.RECENTLY_PURCHASED,
      );
    }
    for (const item of recentlyViewed) {
      bump(
        item.productId,
        70,
        'Based on recently viewed products',
        RecommendationType.RECENTLY_VIEWED,
      );
    }
    for (const p of bestsellers) {
      bump(p.id, 55, 'Popular bestseller', RecommendationType.RECOMMENDED);
    }
    for (const p of featured) {
      bump(p.id, 50, 'Featured for you', RecommendationType.RECOMMENDED);
    }

    // Prefer related products from wishlist/orders for better personalization
    const seedIds = [
      ...wishlistItems.map((i) => i.productId),
      ...recentOrders.map((i) => i.productId),
      ...recentlyViewed.map((i) => i.productId),
    ].slice(0, 10);

    if (seedIds.length) {
      const related = await this.prisma.productRelatedProduct.findMany({
        where: { productId: { in: seedIds } },
        take: 20,
        select: { relatedProductId: true },
      });
      for (const r of related) {
        bump(
          r.relatedProductId,
          75,
          'Similar to products you like',
          RecommendationType.RECOMMENDED,
        );
      }
    }

    // Exclude already purchased if many options exist
    const purchasedSet = new Set(recentOrders.map((o) => o.productId));
    const candidates = [...scored.entries()]
      .filter(([productId]) => !purchasedSet.has(productId) || scored.size < 8)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 20);

    // Ensure we always have something
    if (!candidates.length) {
      const fallback = await this.prisma.product.findMany({
        where: { deletedAt: null, isPublished: true, visibility: 'VISIBLE' },
        take: 10,
        orderBy: [{ isBestSeller: 'desc' }, { createdAt: 'desc' }],
        select: { id: true },
      });
      for (const p of fallback) {
        candidates.push([
          p.id,
          {
            score: 40,
            reason: 'Trending picks from our collection',
            type: RecommendationType.RECOMMENDED,
          },
        ]);
      }
    }

    if (!candidates.length) {
      throw new BusinessException(
        'No products available for recommendations',
        'AIREC_001',
      );
    }

    const created: any[] = [];
    for (const [productId, meta] of candidates) {
      const row = await this.prisma.customerRecommendation.upsert({
        where: {
          customerId_productId_type: {
            customerId: profile.id,
            productId,
            type: meta.type,
          },
        },
        create: {
          customerId: profile.id,
          productId,
          score: meta.score,
          reason: meta.reason,
          type: meta.type,
          isActive: true,
        },
        update: {
          score: meta.score,
          reason: meta.reason,
          isActive: true,
        },
      });
      created.push(row);
    }

    await this.repository.createHistory({
      user: { connect: { id: userId } },
      type: 'GENERATE',
    });

    await this.auditService.log({
      action: 'RECOMMENDATION_GENERATED',
      module: 'ai-recommendation',
      resource: 'recommendation',
      resourceId: profile.id,
      userId,
      newValue: { count: created.length },
    });

    return created.map((r) => this.toResponse(r));
  }

  async getHistory(userId: string, query: RecommendationHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    return this.repository.getHistory(userId, page, limit);
  }

  async trackClick(userId: string) {
    await this.repository.createHistory({
      user: { connect: { id: userId } },
      type: 'CLICK',
    });
  }
}
