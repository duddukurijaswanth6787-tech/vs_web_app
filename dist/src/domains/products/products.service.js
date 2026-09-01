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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const commerce_utils_1 = require("../../shared/commerce/commerce.utils");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const prisma_service_1 = require("../../database/prisma.service");
const products_repository_1 = require("./products.repository");
let ProductsService = class ProductsService {
    prisma;
    productsRepository;
    auditService;
    loggerService;
    notificationService;
    constructor(prisma, productsRepository, auditService, loggerService, notificationService) {
        this.prisma = prisma;
        this.productsRepository = productsRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
        this.notificationService = notificationService;
    }
    toResponse(p) {
        return {
            id: p.id,
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            slug: p.slug,
            shortDescription: p.shortDescription ?? undefined,
            description: p.description ?? undefined,
            brandId: p.brandId,
            brandName: p.brand?.name,
            type: p.type,
            status: p.status,
            visibility: p.visibility,
            channel: p.channel ?? 'BOTH',
            basePrice: Number(p.basePrice),
            salePrice: p.salePrice ? Number(p.salePrice) : undefined,
            wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
            costPrice: p.costPrice ? Number(p.costPrice) : undefined,
            taxPercentage: p.taxPercentage ? Number(p.taxPercentage) : undefined,
            discountType: p.discountType ?? undefined,
            discountValue: p.discountValue ? Number(p.discountValue) : undefined,
            trackInventory: p.trackInventory,
            allowBackorder: p.allowBackorder,
            minimumOrderQuantity: p.minimumOrderQuantity,
            maximumOrderQuantity: p.maximumOrderQuantity,
            weight: p.weight ? Number(p.weight) : undefined,
            length: p.length ? Number(p.length) : undefined,
            width: p.width ? Number(p.width) : undefined,
            height: p.height ? Number(p.height) : undefined,
            isFeatured: p.isFeatured,
            isNewArrival: p.isNewArrival,
            isBestSeller: p.isBestSeller,
            isTrending: p.isTrending ?? false,
            isLimitedStock: p.isLimitedStock ?? false,
            isFestivePick: p.isFestivePick ?? false,
            isExclusive: p.isExclusive ?? false,
            isOnlineOnly: p.isOnlineOnly ?? false,
            hsnCode: p.hsnCode ?? undefined,
            sizeChartTemplateId: p.sizeChartTemplateId ?? undefined,
            taxInclusive: p.taxInclusive ?? true,
            isPublished: p.isPublished,
            publishedAt: p.publishedAt ?? undefined,
            displayOrder: p.displayOrder,
            seoTitle: p.seoTitle ?? undefined,
            seoDescription: p.seoDescription ?? undefined,
            seoKeywords: p.seoKeywords ?? undefined,
            canonicalUrl: p.canonicalUrl ?? undefined,
            searchKeywords: p.searchKeywords ?? undefined,
            gender: p.gender ?? undefined,
            ageGroup: p.ageGroup ?? undefined,
            occasion: p.occasion ?? undefined,
            season: p.season ?? undefined,
            tags: p.tags?.length ? p.tags : undefined,
            collections: p.collections?.length ? p.collections : undefined,
            highlights: p.highlights?.length ? p.highlights : undefined,
            categories: p.categories?.map((pc) => ({
                categoryId: pc.categoryId,
                categoryName: pc.category?.name ?? pc.categoryId,
                categorySlug: pc.category?.slug ?? '',
            })),
            attributes: p.attributeValues?.map((pa) => ({
                attributeId: pa.attributeId,
                attributeName: pa.attribute?.name ?? pa.attributeId,
                attributeType: pa.attribute?.type ?? 'TEXT',
                value: pa.value ?? undefined,
            })),
            relatedProducts: [
                ...(p.relatedTo?.map((r) => ({
                    productId: r.relatedProductId,
                    productName: r.relatedProduct?.name ?? r.relatedProductId,
                })) ?? []),
            ],
            primaryImageUrl: p.media?.find((m) => m.isPrimary)?.url ??
                p.media?.[0]?.url ??
                undefined,
            images: p.media?.map((m) => ({
                id: m.id,
                url: m.url,
                thumbnailUrl: m.thumbnailUrl ?? undefined,
                altText: m.altText ?? undefined,
                isPrimary: m.isPrimary,
                mediaType: m.mediaType,
                color: m.color ?? undefined,
            })),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
    async findAll(query, restrictToPublicChannels = false) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        try {
            const result = await this.productsRepository.findAll({
                search: query.search,
                brandId: query.brandId,
                status: query.status,
                visibility: query.visibility,
                channel: restrictToPublicChannels ? undefined : query.channel,
                channelIn: restrictToPublicChannels ? ['ONLINE', 'BOTH'] : undefined,
                type: query.type,
                gender: query.gender,
                ageGroup: query.ageGroup,
                occasion: query.occasion,
                season: query.season,
                isFeatured: query.isFeatured,
                isNewArrival: query.isNewArrival,
                isBestSeller: query.isBestSeller,
                isPublished: query.isPublished,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                categoryId: query.categoryId,
                page,
                limit,
                sortBy: query.sortBy ?? 'createdAt',
                sortOrder: query.sortOrder ?? 'desc',
            });
            return {
                data: result.data.map((p) => this.toResponse(p)),
                meta: result.meta,
            };
        }
        catch {
            return {
                data: [],
                meta: { page, limit, total: 0, totalPages: 0 },
            };
        }
    }
    async findById(id, restrictToPublicChannels = false) {
        let product = await this.productsRepository.findById(id);
        if (!product) {
            product = await this.productsRepository.findBySlug(id);
        }
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        if (restrictToPublicChannels && product.channel === 'STORE') {
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        }
        return this.toResponse(product);
    }
    async findBySlug(slug, restrictToPublicChannels = false) {
        const product = await this.productsRepository.findBySlug(slug);
        if (!product || product.deletedAt)
            return null;
        if (restrictToPublicChannels && product.channel === 'STORE')
            return null;
        return this.toResponse(product);
    }
    async generateUniqueSlug(nameOrSlug, excludeId, treatAsSlug = false) {
        let slug = treatAsSlug
            ? nameOrSlug
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            : commerce_utils_1.SlugGenerator.generate(nameOrSlug);
        let existing = await this.productsRepository.findBySlug(slug);
        let counter = 1;
        const base = slug;
        while (existing && existing.id !== excludeId) {
            slug = `${base}-${counter}`;
            existing = await this.productsRepository.findBySlug(slug);
            counter++;
        }
        return slug;
    }
    async generateUniqueSku() {
        let sku = commerce_utils_1.SkuGenerator.generate();
        let existing = await this.productsRepository.findBySku(sku);
        while (existing) {
            sku = commerce_utils_1.SkuGenerator.generate();
            existing = await this.productsRepository.findBySku(sku);
        }
        return sku;
    }
    async ensureUniqueBarcode(requested) {
        const base = requested.trim();
        let barcode = base;
        let counter = 1;
        while (await this.productsRepository.findByBarcode(barcode)) {
            barcode = `${base}-${counter}`;
            counter++;
        }
        return barcode;
    }
    async generateUniqueBarcode() {
        let barcode = commerce_utils_1.BarcodeGenerator.generate();
        let existing = await this.productsRepository.findByBarcode(barcode);
        while (existing) {
            barcode = commerce_utils_1.BarcodeGenerator.generate();
            existing = await this.productsRepository.findByBarcode(barcode);
        }
        return barcode;
    }
    validatePrices(dto) {
        if (dto.basePrice !== undefined && dto.basePrice < 0)
            throw new exceptions_1.ValidationException('Base price cannot be negative', 'PRODUCT_PRICE_001');
        if (dto.salePrice !== undefined && dto.salePrice < 0)
            throw new exceptions_1.ValidationException('Sale price cannot be negative', 'PRODUCT_PRICE_002');
        if (dto.wholesalePrice !== undefined && dto.wholesalePrice < 0)
            throw new exceptions_1.ValidationException('Wholesale price cannot be negative', 'PRODUCT_PRICE_003');
        if (dto.costPrice !== undefined && dto.costPrice < 0)
            throw new exceptions_1.ValidationException('Cost price cannot be negative', 'PRODUCT_PRICE_004');
    }
    validateWeightDimensions(dto) {
        if (dto.weight !== undefined && dto.weight < 0)
            throw new exceptions_1.ValidationException('Weight cannot be negative', 'PRODUCT_DIM_001');
        if (dto.length !== undefined && dto.length < 0)
            throw new exceptions_1.ValidationException('Length cannot be negative', 'PRODUCT_DIM_002');
        if (dto.width !== undefined && dto.width < 0)
            throw new exceptions_1.ValidationException('Width cannot be negative', 'PRODUCT_DIM_003');
        if (dto.height !== undefined && dto.height < 0)
            throw new exceptions_1.ValidationException('Height cannot be negative', 'PRODUCT_DIM_004');
    }
    async create(dto, userId) {
        this.validatePrices(dto);
        this.validateWeightDimensions(dto);
        const slug = dto.slug
            ? await this.generateUniqueSlug(dto.slug, undefined, true)
            : await this.generateUniqueSlug(dto.name);
        const sku = await this.generateUniqueSku();
        const barcode = await this.generateUniqueBarcode();
        const product = await this.prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    name: dto.name,
                    slug,
                    sku,
                    barcode,
                    shortDescription: dto.shortDescription,
                    description: dto.description,
                    brand: { connect: { id: dto.brandId } },
                    type: dto.type ?? 'READYMADE',
                    status: dto.status ?? 'DRAFT',
                    visibility: dto.visibility ?? 'VISIBLE',
                    channel: dto.channel ?? 'BOTH',
                    isOnlineOnly: (dto.channel ?? 'BOTH') === 'ONLINE',
                    basePrice: dto.basePrice,
                    salePrice: dto.salePrice,
                    wholesalePrice: dto.wholesalePrice,
                    costPrice: dto.costPrice,
                    taxPercentage: dto.taxPercentage ?? 0,
                    taxInclusive: dto.taxInclusive ?? true,
                    discountType: dto.discountType,
                    discountValue: dto.discountValue,
                    trackInventory: dto.trackInventory ?? true,
                    allowBackorder: dto.allowBackorder ?? false,
                    minimumOrderQuantity: dto.minimumOrderQuantity ?? 1,
                    maximumOrderQuantity: dto.maximumOrderQuantity ?? 0,
                    weight: dto.weight,
                    length: dto.length,
                    width: dto.width,
                    height: dto.height,
                    isFeatured: dto.isFeatured ?? false,
                    isNewArrival: dto.isNewArrival ?? false,
                    isBestSeller: dto.isBestSeller ?? false,
                    isTrending: dto.isTrending ?? false,
                    isPublished: dto.isPublished ?? false,
                    publishedAt: dto.isPublished ? new Date() : undefined,
                    displayOrder: dto.displayOrder ?? 0,
                    seoTitle: dto.seoTitle,
                    seoDescription: dto.seoDescription,
                    seoKeywords: dto.seoKeywords,
                    canonicalUrl: dto.canonicalUrl,
                    searchKeywords: dto.searchKeywords,
                    gender: dto.gender,
                    ageGroup: dto.ageGroup,
                    occasion: dto.occasion,
                    season: dto.season,
                    tags: dto.tags ?? [],
                    collections: dto.collections ?? [],
                    highlights: dto.highlights ?? [],
                    createdBy: userId,
                },
            });
            if (dto.categoryIds?.length) {
                await tx.productCategory.createMany({
                    data: dto.categoryIds.map((categoryId) => ({
                        productId: p.id,
                        categoryId,
                    })),
                });
            }
            if (dto.attributes?.length) {
                await tx.productAttribute.createMany({
                    data: dto.attributes.map((attr) => ({
                        productId: p.id,
                        attributeId: attr.attributeId,
                        value: attr.value,
                    })),
                });
            }
            if (dto.variants?.length) {
                const variantsWithBarcode = await Promise.all(dto.variants.map(async (v) => ({
                    ...v,
                    barcode: v.barcode
                        ? await this.ensureUniqueBarcode(v.barcode)
                        : await this.generateUniqueBarcode(),
                })));
                await tx.productVariant.createMany({
                    data: variantsWithBarcode.map((v) => ({
                        productId: p.id,
                        sku: v.sku,
                        title: v.name,
                        priceOverride: v.price,
                        barcode: v.barcode,
                    })),
                });
            }
            if (dto.media?.length) {
                await tx.productMedia.createMany({
                    data: dto.media.map((m) => ({
                        productId: p.id,
                        url: m.url,
                        mediaType: m.role,
                        displayOrder: m.displayOrder ?? 0,
                        isPrimary: m.role === 'MAIN',
                    })),
                });
            }
            return p;
        });
        await this.auditService.log({
            action: 'PRODUCT_CREATED',
            module: 'products',
            resource: 'product',
            resourceId: product.id,
            userId,
            newValue: { name: dto.name, sku, slug },
        });
        this.loggerService.log({ action: 'product_created', productId: product.id, name: dto.name }, 'ProductsService');
        await this.notificationService.create({
            userId,
            type: 'PRODUCT_CREATED',
            title: 'Product Created',
            message: `Product "${dto.name}" has been created`,
            data: { productId: product.id, name: dto.name, slug },
        });
        return this.findById(product.id);
    }
    async update(id, dto, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        this.validatePrices(dto);
        this.validateWeightDimensions(dto);
        const { brandId, slug, ...rest } = dto;
        const updateData = { ...rest, updatedBy: userId };
        if (slug) {
            updateData.slug = await this.generateUniqueSlug(slug, id, true);
        }
        else if (dto.name) {
            updateData.slug = await this.generateUniqueSlug(dto.name, id);
        }
        if (brandId)
            updateData.brand = { connect: { id: brandId } };
        if (dto.channel)
            updateData.isOnlineOnly = dto.channel === 'ONLINE';
        if (dto.isPublished === true) {
            updateData.publishedAt = new Date();
            if (!dto.status)
                updateData.status = 'ACTIVE';
        }
        if (dto.isPublished === false) {
            updateData.publishedAt = null;
        }
        await this.productsRepository.update(id, updateData);
        await this.auditService.log({
            action: 'PRODUCT_UPDATED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
            oldValue: { name: product.name },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'product_updated', productId: id }, 'ProductsService');
        await this.notificationService.create({
            userId,
            type: 'PRODUCT_UPDATED',
            title: 'Product Updated',
            message: `Product "${product.name}" has been updated`,
            data: { productId: id, name: product.name },
        });
        return this.findById(id);
    }
    async delete(id, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.softDelete(id);
        await this.auditService.log({
            action: 'PRODUCT_DELETED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
            oldValue: { name: product.name },
        });
        this.loggerService.log({ action: 'product_deleted', productId: id }, 'ProductsService');
    }
    async restore(id, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        if (!product.deletedAt)
            throw new exceptions_1.BusinessException('Product is not deleted', 'PRODUCT_002');
        await this.productsRepository.restore(id);
        await this.auditService.log({
            action: 'PRODUCT_RESTORED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'product_restored', productId: id }, 'ProductsService');
        return this.findById(id);
    }
    async publish(id, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        if (product.isPublished)
            throw new exceptions_1.BusinessException('Product is already published', 'PRODUCT_003');
        const colorGroups = await this.prisma.productColorGroup.findMany({
            where: { productId: id },
            include: {
                variants: { where: { deletedAt: null } },
                media: { where: { deletedAt: null, status: 'ACTIVE' } },
                colorAttributeOption: true,
            },
        });
        if (colorGroups.length > 0) {
            for (const cg of colorGroups) {
                const colorName = cg.label ||
                    cg.colorAttributeOption?.label ||
                    cg.colorAttributeOption?.value ||
                    'Color';
                if (!cg.variants || cg.variants.length === 0) {
                    throw new exceptions_1.BusinessException(`Cannot publish: Color group "${colorName}" has 0 variants. Add at least one size variant.`, 'COLOR_GROUP_INCOMPLETE');
                }
                if (!cg.media || cg.media.length === 0) {
                    throw new exceptions_1.BusinessException(`Cannot publish: Color group "${colorName}" has 0 media images. Upload at least one image for this color.`, 'COLOR_GROUP_INCOMPLETE');
                }
            }
        }
        await this.productsRepository.update(id, {
            isPublished: true,
            publishedAt: new Date(),
            status: 'ACTIVE',
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'PRODUCT_PUBLISHED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'product_published', productId: id }, 'ProductsService');
        return this.findById(id);
    }
    async unpublish(id, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        if (!product.isPublished)
            throw new exceptions_1.BusinessException('Product is not published', 'PRODUCT_004');
        await this.productsRepository.update(id, {
            isPublished: false,
            status: 'DRAFT',
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'PRODUCT_UNPUBLISHED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'product_unpublished', productId: id }, 'ProductsService');
        return this.findById(id);
    }
    async feature(id, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.update(id, {
            isFeatured: true,
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'PRODUCT_FEATURED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'product_featured', productId: id }, 'ProductsService');
        return this.findById(id);
    }
    async unfeature(id, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.update(id, {
            isFeatured: false,
            updatedBy: userId,
        });
        this.loggerService.log({ action: 'product_unfeatured', productId: id }, 'ProductsService');
        return this.findById(id);
    }
    async assignCategories(id, dto, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.assignCategories(id, dto.categoryIds);
        await this.auditService.log({
            action: 'PRODUCT_CATEGORY_ASSIGNED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
            newValue: { categoryIds: dto.categoryIds },
        });
        return this.findById(id);
    }
    async removeCategory(id, categoryId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.removeCategory(id, categoryId);
        return this.findById(id);
    }
    async assignAttributes(id, dto, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.assignAttributes(id, dto.attributes);
        await this.auditService.log({
            action: 'PRODUCT_ATTRIBUTE_ASSIGNED',
            module: 'products',
            resource: 'product',
            resourceId: id,
            userId,
            newValue: { attributes: dto.attributes },
        });
        return this.findById(id);
    }
    async removeAttribute(id, attributeId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.removeAttribute(id, attributeId);
        return this.findById(id);
    }
    async assignRelatedProducts(id, dto) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.assignRelatedProducts(id, dto.relatedProductIds);
        return this.findById(id);
    }
    async removeRelatedProduct(id, relatedProductId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.productsRepository.removeRelatedProduct(id, relatedProductId);
        return this.findById(id);
    }
    async assignTags(id, dto, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const merged = [...new Set([...(product.tags ?? []), ...dto.tags])];
        await this.productsRepository.update(id, {
            tags: merged,
            updatedBy: userId,
        });
        return this.findById(id);
    }
    async removeTag(id, tag, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const filtered = (product.tags ?? []).filter((t) => t !== tag);
        await this.productsRepository.update(id, {
            tags: filtered,
            updatedBy: userId,
        });
        return this.findById(id);
    }
    async assignCollections(id, dto, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const merged = [
            ...new Set([...(product.collections ?? []), ...dto.collections]),
        ];
        await this.productsRepository.update(id, {
            collections: merged,
            updatedBy: userId,
        });
        return this.findById(id);
    }
    async removeCollection(id, collection, userId) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const filtered = (product.collections ?? []).filter((c) => c !== collection);
        await this.productsRepository.update(id, {
            collections: filtered,
            updatedBy: userId,
        });
        return this.findById(id);
    }
    async createColorGroup(id, dto) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const existing = await this.prisma.productColorGroup.findUnique({
            where: {
                productId_colorAttributeOptionId: {
                    productId: id,
                    colorAttributeOptionId: dto.colorAttributeOptionId,
                },
            },
        });
        if (existing) {
            throw new exceptions_1.BusinessException('A color group for this color attribute option already exists on this product.', 'DUPLICATE_COLOR_GROUP');
        }
        return this.prisma.productColorGroup.create({
            data: {
                productId: id,
                colorAttributeOptionId: dto.colorAttributeOptionId,
                label: dto.label,
                sortOrder: dto.sortOrder ?? 0,
            },
            include: {
                colorAttributeOption: {
                    select: { id: true, value: true, label: true, swatchImageUrl: true },
                },
                variants: { where: { deletedAt: null } },
                media: { where: { deletedAt: null, status: 'ACTIVE' } },
            },
        });
    }
    async getColorGroups(id) {
        const product = await this.productsRepository.findById(id);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        return this.prisma.productColorGroup.findMany({
            where: { productId: id },
            include: {
                colorAttributeOption: {
                    select: { id: true, value: true, label: true, swatchImageUrl: true },
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
        });
    }
    async deleteColorGroup(productId, groupId) {
        const group = await this.prisma.productColorGroup.findFirst({
            where: { id: groupId, productId },
        });
        if (!group)
            throw new exceptions_1.BusinessException('Color group not found', 'COLOR_GROUP_001');
        await this.prisma.productVariant.updateMany({
            where: { colorGroupId: groupId },
            data: { colorGroupId: null },
        });
        await this.prisma.productMedia.updateMany({
            where: { colorGroupId: groupId },
            data: { colorGroupId: null },
        });
        await this.prisma.productColorGroup.delete({ where: { id: groupId } });
    }
    async syncColorGroups(productId, dto) {
        const product = await this.productsRepository.findById(productId);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        await this.prisma.$transaction(async (tx) => {
            for (const item of dto.colorGroups) {
                let group;
                if (item.id && !item.id.startsWith('legacy-fallback-')) {
                    group = await tx.productColorGroup.update({
                        where: { id: item.id },
                        data: { label: item.label },
                    });
                }
                else {
                    group = await tx.productColorGroup.upsert({
                        where: {
                            productId_colorAttributeOptionId: {
                                productId,
                                colorAttributeOptionId: item.colorAttributeOptionId,
                            },
                        },
                        create: {
                            productId,
                            colorAttributeOptionId: item.colorAttributeOptionId,
                            label: item.label,
                        },
                        update: {
                            label: item.label,
                        },
                    });
                }
                if (item.variantIds && item.variantIds.length > 0) {
                    await tx.productVariant.updateMany({
                        where: { id: { in: item.variantIds } },
                        data: { colorGroupId: group.id },
                    });
                }
                if (item.mediaIds && item.mediaIds.length > 0) {
                    await tx.productMedia.updateMany({
                        where: { id: { in: item.mediaIds } },
                        data: { colorGroupId: group.id },
                    });
                }
            }
        });
        return this.getColorGroups(productId);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_repository_1.ProductsRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService,
        notification_service_1.NotificationService])
], ProductsService);
//# sourceMappingURL=products.service.js.map