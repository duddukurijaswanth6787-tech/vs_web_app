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
exports.AiSearchService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const ai_search_repository_1 = require("./ai-search.repository");
let AiSearchService = class AiSearchService {
    repository;
    auditService;
    prisma;
    constructor(repository, auditService, prisma) {
        this.repository = repository;
        this.auditService = auditService;
        this.prisma = prisma;
    }
    tokenize(query) {
        return query
            .toLowerCase()
            .split(/[^a-z0-9]+/i)
            .map((t) => t.trim())
            .filter((t) => t.length >= 2)
            .slice(0, 8);
    }
    scoreProduct(product, tokens, rawQuery) {
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
        if (hay.includes(q))
            score += 40;
        if (product.name?.toLowerCase().includes(q))
            score += 25;
        for (const token of tokens) {
            if (hay.includes(token))
                score += 8;
            if (product.name?.toLowerCase().includes(token))
                score += 6;
            if ((product.tags ?? []).some((t) => t.toLowerCase().includes(token)))
                score += 4;
        }
        if (product.isBestSeller)
            score += 5;
        if (product.isFeatured)
            score += 4;
        if (product.isNewArrival)
            score += 3;
        return score;
    }
    async search(userId, dto) {
        const limit = Math.min(dto.limit ?? 20, 100);
        const tokens = this.tokenize(dto.query);
        const orFilters = tokens.flatMap((token) => [
            { name: { contains: token, mode: 'insensitive' } },
            { shortDescription: { contains: token, mode: 'insensitive' } },
            { searchKeywords: { contains: token, mode: 'insensitive' } },
            { tags: { has: token } },
            { collections: { has: token } },
            { occasion: { contains: token, mode: 'insensitive' } },
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
    async getSuggestions(query) {
        const q = (query ?? '').trim();
        const productWhere = {
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
    async getHistory(userId, page, limit) {
        const p = page ?? 1;
        const l = Math.min(limit ?? 20, 100);
        const result = await this.repository.getHistory(userId, p, l);
        return {
            data: result.data.map((h) => ({
                id: h.id,
                query: h.query,
                resultCount: h.resultCount,
                clickedProductIds: h.clickedProductIds ?? [],
                createdAt: h.createdAt,
            })),
            meta: result.meta,
        };
    }
    async getTrendingSearches(limit = 10) {
        return this.repository.getTrendingSearches(limit);
    }
    async getStats() {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [totalSearches, zeroResultCount, clickedCount, topQueries] = await Promise.all([
            this.prisma.searchHistory.count({
                where: { createdAt: { gte: since } },
            }),
            this.prisma.searchHistory.count({
                where: { createdAt: { gte: since }, resultCount: 0 },
            }),
            this.prisma.searchHistory.count({
                where: {
                    createdAt: { gte: since },
                    NOT: { clickedProductIds: { isEmpty: true } },
                },
            }),
            this.repository.getTrendingSearches(1),
        ]);
        return {
            totalSearches,
            zeroResultCount,
            zeroResultRate: totalSearches
                ? Number(((zeroResultCount / totalSearches) * 100).toFixed(1))
                : 0,
            clickThroughRate: totalSearches
                ? Number(((clickedCount / totalSearches) * 100).toFixed(1))
                : 0,
            topQuery: topQueries[0],
        };
    }
};
exports.AiSearchService = AiSearchService;
exports.AiSearchService = AiSearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_search_repository_1.AiSearchRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService])
], AiSearchService);
//# sourceMappingURL=ai-search.service.js.map