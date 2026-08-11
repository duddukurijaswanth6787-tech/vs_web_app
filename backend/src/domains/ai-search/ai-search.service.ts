import { Injectable } from '@nestjs/common';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { AiSearchRepository } from './ai-search.repository';
import {
  AiSearchDto,
  SearchSuggestionResponse,
  SearchHistoryResponse,
  TrendingSearchResponse,
} from './ai-search.types';

@Injectable()
export class AiSearchService {
  constructor(
    private readonly repository: AiSearchRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
      .slice(0, 8);
  }

  private scoreProduct(
    product: any,
    tokens: string[],
    rawQuery: string,
  ): number {
    const hay = [
      product.name,
      product.slug,
      product.shortDescription,
      product.searchKeywords,
      ...(product.tags ?? []),
      ...(product.collections ?? []),
      product.occasion,
      product.season,
      product.gender,
      product.brand?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    let score = 0;
    const q = rawQuery.toLowerCase();
    if (hay.includes(q)) score += 40;
    if (product.name?.toLowerCase().includes(q)) score += 25;
    for (const token of tokens) {
      if (hay.includes(token)) score += 8;
      if (product.name?.toLowerCase().includes(token)) score += 6;
      if (
        (product.tags ?? []).some((t: string) =>
          t.toLowerCase().includes(token),
        )
      )
        score += 4;
    }
    if (product.isBestSeller) score += 5;
    if (product.isFeatured) score += 4;
    if (product.isNewArrival) score += 3;
    return score;
  }

  async search(userId: string, dto: AiSearchDto) {
    const limit = Math.min(dto.limit ?? 20, 100);
    const tokens = this.tokenize(dto.query);
    const orFilters = tokens.flatMap((token) => [
      { name: { contains: token, mode: 'insensitive' as const } },
      { shortDescription: { contains: token, mode: 'insensitive' as const } },
      { searchKeywords: { contains: token, mode: 'insensitive' as const } },
      { tags: { has: token } },
      { collections: { has: token } },
      { occasion: { contains: token, mode: 'insensitive' as const } },
    ]);

    const candidates = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        visibility: 'VISIBLE',
        ...(orFilters.length ? { OR: orFilters } : {}),
        ...(dto.filters?.brandId
          ? { brandId: String(dto.filters.brandId) }
          : {}),
        ...(dto.filters?.categoryId
          ? {
              categories: {
                some: { categoryId: String(dto.filters.categoryId) },
              },
            }
          : {}),
        ...(dto.filters?.gender ? { gender: String(dto.filters.gender) } : {}),
        ...(dto.filters?.minPrice || dto.filters?.maxPrice
          ? {
              basePrice: {
                ...(dto.filters?.minPrice
                  ? { gte: Number(dto.filters.minPrice) }
                  : {}),
                ...(dto.filters?.maxPrice
                  ? { lte: Number(dto.filters.maxPrice) }
                  : {}),
              },
            }
          : {}),
      },
      take: Math.max(limit * 3, 60),
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        media: {
          where: { deletedAt: null },
          take: 1,
          orderBy: { displayOrder: 'asc' },
          select: { url: true },
        },
      },
    });

    const ranked = candidates
      .map((p) => ({
        product: p,
        score: this.scoreProduct(p, tokens, dto.query),
      }))
      .filter((r) => r.score > 0 || !tokens.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const results = ranked.map(({ product, score }) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand?.name,
      price: Number(product.salePrice ?? product.basePrice),
      originalPrice: Number(product.basePrice),
      image: product.media?.[0]?.url,
      score,
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
      occasion: product.occasion,
    }));

    const history = await this.repository.createHistory({
      user: { connect: { id: userId } },
      query: dto.query,
      resultCount: results.length,
      filters: dto.filters ?? undefined,
      clickedProductIds: [],
    });

    // Keep history resultCount accurate if create ignored it somehow
    await this.prisma.searchHistory.update({
      where: { id: history.id },
      data: { resultCount: results.length },
    });

    await this.auditService.log({
      action: 'SEARCH_COMPLETED',
      module: 'ai-search',
      resource: 'search',
      resourceId: history.id,
      userId,
      newValue: { query: dto.query, resultCount: results.length },
    });

    return {
      historyId: history.id,
      query: dto.query,
      resultCount: results.length,
      results,
    };
  }

  async getSuggestions(query?: string): Promise<SearchSuggestionResponse> {
    const q = (query ?? '').trim();
    const productWhere: any = {
      deletedAt: null,
      isPublished: true,
      visibility: 'VISIBLE',
    };
    if (q) {
      productWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: this.tokenize(q) } },
      ];
    }

    const [products, categories, brands] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        take: 8,
        orderBy: [{ isBestSeller: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          deletedAt: null,
          ...(q
            ? { name: { contains: q, mode: 'insensitive' } }
            : { isFeatured: true }),
        },
        take: 6,
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.brand.findMany({
        where: {
          deletedAt: null,
          ...(q
            ? { name: { contains: q, mode: 'insensitive' } }
            : { isFeatured: true }),
        },
        take: 6,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.salePrice ?? p.basePrice),
      })),
      categories,
      brands,
    };
  }

  async getHistory(userId: string, page: number, limit: number) {
    const p = page ?? 1;
    const l = Math.min(limit ?? 20, 100);
    const result = await this.repository.getHistory(userId, p, l);
    return {
      data: result.data.map((h: any): SearchHistoryResponse => ({
        id: h.id,
        query: h.query,
        resultCount: h.resultCount,
        clickedProductIds: (h.clickedProductIds as string[]) ?? [],
        createdAt: h.createdAt,
      })),
      meta: result.meta,
    };
  }

  async getTrendingSearches(limit = 10): Promise<TrendingSearchResponse[]> {
    return this.repository.getTrendingSearches(limit);
  }
}
