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
exports.AiSearchRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AiSearchRepository = class AiSearchRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createHistory(data) {
        return this.prisma.searchHistory.create({ data });
    }
    async getHistory(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.searchHistory.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.searchHistory.count({ where: { userId } }),
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
    async getTrendingSearches(limit) {
        const results = await this.prisma.searchHistory.groupBy({
            by: ['query'],
            _count: { query: true },
            orderBy: { _count: { query: 'desc' } },
            take: limit,
        });
        return results.map((r) => ({ query: r.query, count: r._count.query }));
    }
    async updateHistoryClicks(id, clickedProductIds) {
        return this.prisma.searchHistory.update({
            where: { id },
            data: { clickedProductIds },
        });
    }
};
exports.AiSearchRepository = AiSearchRepository;
exports.AiSearchRepository = AiSearchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiSearchRepository);
//# sourceMappingURL=ai-search.repository.js.map