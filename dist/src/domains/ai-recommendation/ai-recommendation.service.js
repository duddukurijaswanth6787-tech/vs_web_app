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
exports.AiRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const ai_recommendation_repository_1 = require("./ai-recommendation.repository");
const ai_recommendation_types_1 = require("./ai-recommendation.types");
let AiRecommendationService = class AiRecommendationService {
    repository;
    auditService;
    prisma;
    constructor(repository, auditService, prisma) {
        this.repository = repository;
        this.auditService = auditService;
        this.prisma = prisma;
    }
    toResponse(r) {
        return {
            id: r.id,
            productId: r.productId,
            score: Number(r.score),
            reason: r.reason ?? undefined,
            type: r.type,
            createdAt: r.createdAt,
        };
    }
    async getCustomerProfile(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        }
        return profile;
    }
    async getRecommendations(userId, query) {
        const profile = await this.getCustomerProfile(userId);
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.repository.findByCustomer(profile.id, query.type, page, limit);
        if (!result.data.length) {
            await this.generateRecommendations(userId);
            const refreshed = await this.repository.findByCustomer(profile.id, query.type, page, limit);
            return {
                data: refreshed.data.map((r) => this.toResponse(r)),
                meta: refreshed.meta,
            };
        }
        return {
            data: result.data.map((r) => this.toResponse(r)),
            meta: result.meta,
        };
    }
    async generateRecommendations(userId) {
        const profile = await this.getCustomerProfile(userId);
        const [wishlistItems, recentOrders, recentlyViewed, bestsellers, featured] = await Promise.all([
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
        const scored = new Map();
        const bump = (productId, score, reason, type) => {
            const existing = scored.get(productId);
            if (!existing || score > existing.score) {
                scored.set(productId, { score, reason, type });
            }
            else {
                existing.score += score * 0.25;
            }
        };
        for (const item of wishlistItems) {
            bump(item.productId, 90, 'Based on your wishlist', ai_recommendation_types_1.RecommendationType.WISHLIST_BASED);
        }
        for (const item of recentOrders) {
            bump(item.productId, 80, 'Because you purchased similar styles', ai_recommendation_types_1.RecommendationType.RECENTLY_PURCHASED);
        }
        for (const item of recentlyViewed) {
            bump(item.productId, 70, 'Based on recently viewed products', ai_recommendation_types_1.RecommendationType.RECENTLY_VIEWED);
        }
        for (const p of bestsellers) {
            bump(p.id, 55, 'Popular bestseller', ai_recommendation_types_1.RecommendationType.RECOMMENDED);
        }
        for (const p of featured) {
            bump(p.id, 50, 'Featured for you', ai_recommendation_types_1.RecommendationType.RECOMMENDED);
        }
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
                bump(r.relatedProductId, 75, 'Similar to products you like', ai_recommendation_types_1.RecommendationType.RECOMMENDED);
            }
        }
        const purchasedSet = new Set(recentOrders.map((o) => o.productId));
        const candidates = [...scored.entries()]
            .filter(([productId]) => !purchasedSet.has(productId) || scored.size < 8)
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 20);
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
                        type: ai_recommendation_types_1.RecommendationType.RECOMMENDED,
                    },
                ]);
            }
        }
        if (!candidates.length) {
            throw new exceptions_1.BusinessException('No products available for recommendations', 'AIREC_001');
        }
        const created = [];
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
    async getHistory(userId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        return this.repository.getHistory(userId, page, limit);
    }
    async trackClick(userId) {
        await this.repository.createHistory({
            user: { connect: { id: userId } },
            type: 'CLICK',
        });
    }
};
exports.AiRecommendationService = AiRecommendationService;
exports.AiRecommendationService = AiRecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_recommendation_repository_1.AiRecommendationRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService])
], AiRecommendationService);
//# sourceMappingURL=ai-recommendation.service.js.map