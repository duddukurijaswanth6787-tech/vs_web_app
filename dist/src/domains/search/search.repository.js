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
exports.SearchRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const RANKED_CANDIDATE_CAP = 3000;
let SearchRepository = class SearchRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRankedProductIds(q) {
        const like = `%${q}%`;
        return this.prisma.$queryRaw `
      SELECT "id",
        GREATEST(
          ts_rank("searchVector", plainto_tsquery('english', ${q})),
          similarity("name", ${q}) * 0.5
        ) AS rank
      FROM "products"
      WHERE "deletedAt" IS NULL
        AND "isPublished" = true
        AND "visibility" = 'VISIBLE'
        AND (
          "searchVector" @@ plainto_tsquery('english', ${q})
          OR similarity("name", ${q}) > 0.25
          OR "sku" ILIKE ${like}
          OR "barcode" ILIKE ${like}
        )
      ORDER BY rank DESC
      LIMIT ${RANKED_CANDIDATE_CAP}
    `;
    }
    async search(params) {
        const { q, brandId, categoryId, gender, ageGroup, occasion, season, type, isFeatured, isNewArrival, isBestSeller, inStock, minPrice, maxPrice, tags, collections, attributeFilters, sortBy, sortOrder, page, limit, } = params;
        const where = {
            deletedAt: null,
            isPublished: true,
            visibility: 'VISIBLE',
        };
        let rankMap = null;
        if (q) {
            const ranked = await this.getRankedProductIds(q);
            if (ranked.length === 0) {
                return {
                    data: [],
                    meta: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 1,
                        hasNext: false,
                        hasPrevious: false,
                    },
                };
            }
            rankMap = new Map(ranked.map((r) => [r.id, Number(r.rank)]));
            where.OR = [
                { id: { in: ranked.map((r) => r.id) } },
                { brand: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        if (brandId)
            where.brandId = brandId;
        if (gender)
            where.gender = gender;
        if (ageGroup)
            where.ageGroup = ageGroup;
        if (occasion)
            where.occasion = occasion;
        if (season)
            where.season = season;
        if (type)
            where.type = type;
        if (isFeatured !== undefined)
            where.isFeatured = isFeatured;
        if (isNewArrival !== undefined)
            where.isNewArrival = isNewArrival;
        if (isBestSeller !== undefined)
            where.isBestSeller = isBestSeller;
        if (tags?.length)
            where.tags = { hasSome: tags };
        if (collections?.length)
            where.collections = { hasSome: collections };
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.basePrice = {};
            if (minPrice !== undefined)
                where.basePrice.gte = minPrice;
            if (maxPrice !== undefined)
                where.basePrice.lte = maxPrice;
        }
        if (categoryId)
            where.categories = { some: { categoryId } };
        if (inStock) {
            where.variants = { some: { inventory: { stockStatus: 'IN_STOCK' } } };
        }
        if (attributeFilters && Object.keys(attributeFilters).length > 0) {
            const attributeConditions = Object.entries(attributeFilters).map(([slug, values]) => ({
                attributeValues: {
                    some: {
                        attribute: { slug },
                        OR: [
                            { value: { in: values, mode: 'insensitive' } },
                            { option: { value: { in: values } } },
                        ],
                    },
                },
            }));
            where.AND = attributeConditions.map((c) => c);
        }
        const include = {
            brand: { select: { id: true, name: true, slug: true } },
            categories: {
                include: { category: { select: { id: true, name: true, slug: true } } },
            },
        };
        if (rankMap) {
            const matches = await this.prisma.product.findMany({ where, include });
            const sorted = sortBy === 'relevance'
                ? matches.sort((a, b) => (rankMap.get(b.id) ?? 0) - (rankMap.get(a.id) ?? 0))
                : matches.sort((a, b) => {
                    const av = a[sortBy];
                    const bv = b[sortBy];
                    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
                    return sortOrder === 'asc' ? cmp : -cmp;
                });
            const total = sorted.length;
            const data = sorted.slice((page - 1) * limit, (page - 1) * limit + limit);
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
        const orderBy = sortBy === 'relevance'
            ? [
                { isFeatured: 'desc' },
                { displayOrder: 'asc' },
                { createdAt: 'desc' },
            ]
            : [{ [sortBy]: sortOrder }];
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include,
                skip: (page - 1) * limit,
                take: limit,
                orderBy,
            }),
            this.prisma.product.count({ where }),
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
    async getAvailableFilters(baseWhere) {
        const products = await this.prisma.product.findMany({
            where: baseWhere,
            include: {
                brand: { select: { id: true, name: true } },
                categories: {
                    select: { category: { select: { id: true, name: true } } },
                },
                attributeValues: {
                    select: {
                        value: true,
                        attribute: { select: { slug: true, name: true } },
                    },
                },
            },
            take: 1000,
        });
        const brands = new Map();
        const categories = new Map();
        const genders = new Map();
        const ageGroups = new Map();
        const occasions = new Map();
        const seasons = new Map();
        const types = new Map();
        const tags = new Map();
        const collections = new Map();
        let minPrice = Infinity;
        let maxPrice = 0;
        const attributeMap = new Map();
        for (const p of products) {
            if (p.brandId) {
                const existing = brands.get(p.brandId);
                brands.set(p.brandId, {
                    label: p.brand?.name ?? p.brandId,
                    count: (existing?.count ?? 0) + 1,
                });
            }
            for (const pc of p.categories) {
                const existing = categories.get(pc.category.id);
                categories.set(pc.category.id, {
                    label: pc.category.name,
                    count: (existing?.count ?? 0) + 1,
                });
            }
            if (p.gender)
                genders.set(p.gender, (genders.get(p.gender) ?? 0) + 1);
            if (p.ageGroup)
                ageGroups.set(p.ageGroup, (ageGroups.get(p.ageGroup) ?? 0) + 1);
            if (p.occasion)
                occasions.set(p.occasion, (occasions.get(p.occasion) ?? 0) + 1);
            if (p.season)
                seasons.set(p.season, (seasons.get(p.season) ?? 0) + 1);
            if (p.type)
                types.set(p.type, (types.get(p.type) ?? 0) + 1);
            for (const t of p.tags)
                tags.set(t, (tags.get(t) ?? 0) + 1);
            for (const c of p.collections)
                collections.set(c, (collections.get(c) ?? 0) + 1);
            const price = Number(p.salePrice ?? p.basePrice);
            if (price < minPrice)
                minPrice = price;
            if (price > maxPrice)
                maxPrice = price;
            for (const av of p.attributeValues) {
                const slug = av.attribute.slug;
                const value = av.value;
                if (!value)
                    continue;
                if (!attributeMap.has(slug))
                    attributeMap.set(slug, {
                        name: av.attribute.name,
                        options: new Map(),
                    });
                const attr = attributeMap.get(slug);
                attr.options.set(value, (attr.options.get(value) ?? 0) + 1);
            }
        }
        const toOptions = (map) => [...map.entries()]
            .map(([value, count]) => ({ value, label: value, count }))
            .sort((a, b) => b.count - a.count);
        const toOptionsWithLabel = (map) => [...map.entries()]
            .map(([value, { label, count }]) => ({ value, label, count }))
            .sort((a, b) => b.count - a.count);
        return {
            brands: toOptionsWithLabel(brands),
            categories: toOptionsWithLabel(categories),
            genders: toOptions(genders),
            ageGroups: toOptions(ageGroups),
            occasions: toOptions(occasions),
            seasons: toOptions(seasons),
            types: toOptions(types),
            tags: toOptions(tags),
            collections: toOptions(collections),
            priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice },
            attributes: [...attributeMap.entries()].map(([slug, { name, options }]) => ({
                slug,
                name,
                options: [...options.entries()]
                    .map(([value, count]) => ({ value, label: value, count }))
                    .sort((a, b) => b.count - a.count),
            })),
        };
    }
    async globalSearch(q, limit) {
        const [products, orders, customers, categories, brands, coupons] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { sku: { contains: q, mode: 'insensitive' } },
                        { barcode: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    slug: true,
                    basePrice: true,
                },
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.order.findMany({
                where: {
                    OR: [{ orderNumber: { contains: q, mode: 'insensitive' } }],
                },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    grandTotal: true,
                    currency: true,
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: q, mode: 'insensitive' } },
                        { lastName: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, email: true },
                take: limit,
                orderBy: { firstName: 'asc' },
            }),
            this.prisma.category.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { slug: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, slug: true },
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.brand.findMany({
                where: { name: { contains: q, mode: 'insensitive' } },
                select: { id: true, name: true, slug: true },
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.coupon.findMany({
                where: {
                    OR: [
                        { code: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, code: true, name: true, type: true },
                take: limit,
                orderBy: { name: 'asc' },
            }),
        ]);
        return {
            products: products.map((p) => ({ ...p, basePrice: Number(p.basePrice) })),
            orders,
            customers,
            categories,
            brands,
            coupons,
        };
    }
    async autocomplete(q, limit) {
        const [products, tagResults] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    deletedAt: null,
                    isPublished: true,
                    visibility: 'VISIBLE',
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { sku: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    basePrice: true,
                    tags: true,
                },
                take: limit,
            }),
            this.prisma.product.findMany({
                where: { deletedAt: null, isPublished: true, tags: { has: q } },
                select: { tags: true },
                take: 50,
            }),
        ]);
        const suggestions = new Set();
        for (const p of tagResults) {
            for (const t of p.tags) {
                if (t.toLowerCase().includes(q.toLowerCase()))
                    suggestions.add(t);
            }
        }
        for (const p of products)
            suggestions.add(p.name);
        return {
            products: products.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                basePrice: Number(p.basePrice),
            })),
            suggestions: [...suggestions].slice(0, limit),
        };
    }
};
exports.SearchRepository = SearchRepository;
exports.SearchRepository = SearchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchRepository);
//# sourceMappingURL=search.repository.js.map