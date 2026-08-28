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
exports.ProductsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ProductsRepository = class ProductsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, brandId, status, visibility, channel, channelIn, type, gender, ageGroup, occasion, season, isFeatured, isNewArrival, isBestSeller, isPublished, minPrice, maxPrice, categoryId, page, limit, sortBy, sortOrder, } = params;
        const where = { deletedAt: null };
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { shortDescription: { contains: search, mode: 'insensitive' } },
                { searchKeywords: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        if (brandId)
            where.brandId = brandId;
        if (status)
            where.status = status;
        if (visibility)
            where.visibility = visibility;
        if (channelIn)
            where.channel = { in: channelIn };
        else if (channel)
            where.channel = channel;
        if (type)
            where.type = type;
        if (gender)
            where.gender = gender;
        if (ageGroup)
            where.ageGroup = ageGroup;
        if (occasion)
            where.occasion = occasion;
        if (season)
            where.season = season;
        if (isFeatured !== undefined)
            where.isFeatured = isFeatured;
        if (isNewArrival !== undefined)
            where.isNewArrival = isNewArrival;
        if (isBestSeller !== undefined)
            where.isBestSeller = isBestSeller;
        if (isPublished !== undefined)
            where.isPublished = isPublished;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.basePrice = {};
            if (minPrice !== undefined)
                where.basePrice.gte = minPrice;
            if (maxPrice !== undefined)
                where.basePrice.lte = maxPrice;
        }
        if (categoryId) {
            where.categories = { some: { categoryId } };
        }
        const include = {
            brand: { select: { id: true, name: true, slug: true } },
            categories: {
                include: { category: { select: { id: true, name: true, slug: true } } },
            },
            attributeValues: {
                include: {
                    attribute: { select: { id: true, name: true, type: true } },
                },
            },
            media: {
                where: { deletedAt: null, status: 'ACTIVE' },
                orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
                take: 8,
            },
        };
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
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
    detailInclude() {
        return {
            brand: { select: { id: true, name: true, slug: true } },
            colorGroups: {
                include: {
                    colorAttributeOption: {
                        select: {
                            id: true,
                            value: true,
                            label: true,
                            swatchImageUrl: true,
                        },
                    },
                    variants: {
                        where: { deletedAt: null },
                        include: {
                            attributeValues: {
                                include: {
                                    attribute: { select: { id: true, name: true, slug: true } },
                                    option: {
                                        select: {
                                            id: true,
                                            value: true,
                                            label: true,
                                            swatchImageUrl: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    media: {
                        where: { deletedAt: null, status: 'ACTIVE' },
                        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
                    },
                },
                orderBy: { sortOrder: 'asc' },
            },
            categories: {
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                },
            },
            attributeValues: {
                include: {
                    attribute: { select: { id: true, name: true, type: true } },
                },
            },
            media: {
                where: { deletedAt: null, status: 'ACTIVE' },
                orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            },
            relatedTo: {
                include: { relatedProduct: { select: { id: true, name: true } } },
            },
            relatedFrom: {
                include: { product: { select: { id: true, name: true } } },
            },
        };
    }
    async findBasicById(id) {
        return this.prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                brand: { select: { name: true } },
                media: {
                    where: { isPrimary: true, status: 'ACTIVE' },
                    select: { url: true },
                    take: 1,
                },
            },
        });
    }
    async findById(id) {
        return this.prisma.product.findUnique({
            where: { id },
            include: this.detailInclude(),
        });
    }
    async findBySku(sku) {
        return this.prisma.product.findUnique({ where: { sku } });
    }
    async findBySlug(slug) {
        return this.prisma.product.findUnique({
            where: { slug },
            include: this.detailInclude(),
        });
    }
    async findByBarcode(barcode) {
        return this.prisma.product.findUnique({ where: { barcode } });
    }
    async create(data) {
        return this.prisma.product.create({ data });
    }
    async update(id, data) {
        return this.prisma.product.update({ where: { id }, data });
    }
    async softDelete(id) {
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restore(id) {
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: null, status: 'DRAFT' },
        });
    }
    async assignCategories(productId, categoryIds) {
        await this.prisma.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId, categoryId })),
            skipDuplicates: true,
        });
    }
    async removeCategory(productId, categoryId) {
        await this.prisma.productCategory.delete({
            where: { productId_categoryId: { productId, categoryId } },
        });
    }
    async assignAttributes(productId, entries) {
        await this.prisma.productAttribute.createMany({
            data: entries.map((e) => ({
                productId,
                attributeId: e.attributeId,
                value: e.value,
            })),
            skipDuplicates: true,
        });
    }
    async removeAttribute(productId, attributeId) {
        await this.prisma.productAttribute.delete({
            where: { productId_attributeId: { productId, attributeId } },
        });
    }
    async assignRelatedProducts(productId, relatedProductIds) {
        await this.prisma.productRelatedProduct.createMany({
            data: relatedProductIds.map((rpid) => ({
                productId,
                relatedProductId: rpid,
            })),
            skipDuplicates: true,
        });
    }
    async removeRelatedProduct(productId, relatedProductId) {
        await this.prisma.productRelatedProduct.delete({
            where: { productId_relatedProductId: { productId, relatedProductId } },
        });
    }
};
exports.ProductsRepository = ProductsRepository;
exports.ProductsRepository = ProductsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsRepository);
//# sourceMappingURL=products.repository.js.map