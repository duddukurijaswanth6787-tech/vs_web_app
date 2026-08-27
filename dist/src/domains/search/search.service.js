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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const search_repository_1 = require("./search.repository");
let SearchService = class SearchService {
    searchRepository;
    auditService;
    constructor(searchRepository, auditService) {
        this.searchRepository = searchRepository;
        this.auditService = auditService;
    }
    buildBaseWhere(query) {
        const where = {
            deletedAt: null,
            isPublished: true,
            visibility: 'VISIBLE',
        };
        if (query.brandId)
            where.brandId = query.brandId;
        if (query.gender)
            where.gender = query.gender;
        if (query.ageGroup)
            where.ageGroup = query.ageGroup;
        if (query.occasion)
            where.occasion = query.occasion;
        if (query.season)
            where.season = query.season;
        if (query.type)
            where.type = query.type;
        if (query.isFeatured !== undefined)
            where.isFeatured = query.isFeatured;
        if (query.isNewArrival !== undefined)
            where.isNewArrival = query.isNewArrival;
        if (query.isBestSeller !== undefined)
            where.isBestSeller = query.isBestSeller;
        if (query.categoryId)
            where.categories = { some: { categoryId: query.categoryId } };
        return where;
    }
    async search(query, userId) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const [result, availableFilters] = await Promise.all([
            this.searchRepository.search({
                q: query.q,
                brandId: query.brandId,
                categoryId: query.categoryId,
                gender: query.gender,
                ageGroup: query.ageGroup,
                occasion: query.occasion,
                season: query.season,
                type: query.type,
                isFeatured: query.isFeatured,
                isNewArrival: query.isNewArrival,
                isBestSeller: query.isBestSeller,
                inStock: query.inStock,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                tags: query.tags,
                collections: query.collections,
                attributeFilters: query.attributeFilters,
                sortBy: query.sortBy ?? 'relevance',
                sortOrder: query.sortOrder ?? 'desc',
                page,
                limit,
            }),
            this.searchRepository.getAvailableFilters(this.buildBaseWhere(query)),
        ]);
        if (userId && query.q) {
            await this.auditService.log({
                action: 'SEARCH_PERFORMED',
                module: 'search',
                resource: 'search',
                userId,
                newValue: {
                    query: query.q,
                    filters: { brandId: query.brandId, categoryId: query.categoryId },
                },
            });
        }
        return {
            data: result.data.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                sku: p.sku,
                shortDescription: p.shortDescription ?? undefined,
                brandId: p.brandId,
                brandName: p.brand?.name,
                basePrice: Number(p.basePrice),
                salePrice: p.salePrice ? Number(p.salePrice) : undefined,
                status: p.status,
                isFeatured: p.isFeatured,
                isNewArrival: p.isNewArrival,
                isBestSeller: p.isBestSeller,
                gender: p.gender ?? undefined,
                ageGroup: p.ageGroup ?? undefined,
                tags: p.tags?.length ? p.tags : undefined,
                collections: p.collections?.length ? p.collections : undefined,
                createdAt: p.createdAt,
            })),
            appliedFilters: {
                q: query.q,
                brandId: query.brandId,
                categoryId: query.categoryId,
                gender: query.gender,
                ageGroup: query.ageGroup,
                occasion: query.occasion,
                season: query.season,
                type: query.type,
                isFeatured: query.isFeatured,
                isNewArrival: query.isNewArrival,
                isBestSeller: query.isBestSeller,
                inStock: query.inStock,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                tags: query.tags,
                collections: query.collections,
                attributeFilters: query.attributeFilters,
            },
            availableFilters,
            meta: result.meta,
        };
    }
    async globalSearch(dto) {
        return this.searchRepository.globalSearch(dto.q, dto.limit ?? 5);
    }
    async autocomplete(dto) {
        return this.searchRepository.autocomplete(dto.q, dto.limit ?? 10);
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_repository_1.SearchRepository,
        audit_service_1.AuditService])
], SearchService);
//# sourceMappingURL=search.service.js.map