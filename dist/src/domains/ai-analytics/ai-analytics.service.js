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
exports.AiAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AiAnalyticsService = class AiAnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAnalytics(query) {
        const startDate = query.startDate
            ? new Date(query.startDate)
            : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = query.endDate ? new Date(query.endDate) : new Date();
        const [totalConversations, totalSearches, totalRecommendations, popularSearches, popularProducts, usageByFeature,] = await Promise.all([
            this.prisma.aiConversation.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
            this.prisma.searchHistory.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
            this.prisma.customerRecommendation.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
            this.getPopularSearches(10),
            this.getPopularProducts(10),
            this.getUsageByFeature(query.startDate, query.endDate),
        ]);
        return {
            totalConversations,
            totalSearches,
            totalRecommendations,
            popularSearches,
            popularProducts,
            usageByFeature,
        };
    }
    async getUsageByFeature(startDate, endDate) {
        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const logs = await this.prisma.aiUsageLog.groupBy({
            by: ['feature'],
            where: { createdAt: { gte: start, lte: end } },
            _count: { id: true },
            _sum: { tokensUsed: true, cost: true },
        });
        return logs.map((log) => ({
            feature: log.feature,
            count: log._count.id,
            totalTokens: log._sum.tokensUsed ?? 0,
            totalCost: Number(log._sum.cost ?? 0),
        }));
    }
    async getPopularSearches(limit = 10) {
        const searches = await this.prisma.searchHistory.groupBy({
            by: ['query'],
            _count: { query: true },
            orderBy: { _count: { query: 'desc' } },
            take: limit,
        });
        return searches.map((s) => ({
            query: s.query,
            count: s._count.query,
        }));
    }
    async getPopularProducts(limit = 10) {
        const products = await this.prisma.customerRecommendation.groupBy({
            by: ['productId'],
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: limit,
        });
        return products.map((p) => ({
            productId: p.productId,
            count: p._count.productId,
        }));
    }
};
exports.AiAnalyticsService = AiAnalyticsService;
exports.AiAnalyticsService = AiAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiAnalyticsService);
//# sourceMappingURL=ai-analytics.service.js.map