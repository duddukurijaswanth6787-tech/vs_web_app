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
exports.ProductVariantsService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const commerce_utils_1 = require("../../shared/commerce/commerce.utils");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const product_variants_repository_1 = require("./product-variants.repository");
const products_repository_1 = require("../products/products.repository");
let ProductVariantsService = class ProductVariantsService {
    prisma;
    variantsRepository;
    productsRepository;
    auditService;
    loggerService;
    constructor(prisma, variantsRepository, productsRepository, auditService, loggerService) {
        this.prisma = prisma;
        this.variantsRepository = variantsRepository;
        this.productsRepository = productsRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
    }
    toResponse(v) {
        return {
            id: v.id,
            productId: v.productId,
            sku: v.sku,
            barcode: v.barcode,
            title: v.title,
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            salePriceOverride: v.salePriceOverride
                ? Number(v.salePriceOverride)
                : undefined,
            costPrice: v.costPrice ? Number(v.costPrice) : undefined,
            weight: v.weight ? Number(v.weight) : undefined,
            length: v.length ? Number(v.length) : undefined,
            width: v.width ? Number(v.width) : undefined,
            height: v.height ? Number(v.height) : undefined,
            displayOrder: v.displayOrder,
            status: v.status,
            isDefault: v.isDefault,
            isActive: v.isActive,
            attributeValues: v.attributeValues?.map((av) => ({
                attributeId: av.attributeId,
                attributeName: av.attribute?.name ?? av.attributeId,
                attributeType: av.attribute?.type ?? 'TEXT',
                attributeOptionId: av.attributeOptionId ?? undefined,
                optionLabel: av.option?.label ?? undefined,
                value: av.value ?? undefined,
            })),
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.variantsRepository.findAll({
            productId: query.productId,
            status: query.status,
            isActive: query.isActive,
            isDefault: query.isDefault,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
        return {
            data: result.data.map((v) => this.toResponse(v)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        return this.toResponse(variant);
    }
    async generateUniqueSku() {
        let sku = commerce_utils_1.SkuGenerator.generate();
        while (await this.variantsRepository.findBySku(sku))
            sku = commerce_utils_1.SkuGenerator.generate();
        return sku;
    }
    async ensureUniqueSku(requested) {
        const base = requested.trim().toUpperCase().replace(/\s+/g, '-');
        let sku = base;
        let counter = 1;
        while (await this.variantsRepository.findBySku(sku)) {
            sku = `${base}-${counter}`;
            counter++;
        }
        return sku;
    }
    async ensureUniqueBarcode(requested) {
        const base = requested.trim();
        let barcode = base;
        let counter = 1;
        while (await this.variantsRepository.findByBarcode(barcode)) {
            barcode = `${base}-${counter}`;
            counter++;
        }
        return barcode;
    }
    async generateUniqueBarcode() {
        let barcode = commerce_utils_1.BarcodeGenerator.generate();
        while (await this.variantsRepository.findByBarcode(barcode))
            barcode = commerce_utils_1.BarcodeGenerator.generate();
        return barcode;
    }
    async create(dto, userId) {
        const product = await this.productsRepository.findById(dto.productId);
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        if (dto.colorGroupId && dto.attributeValues?.length) {
            const existingVariantsInGroup = await this.prisma.productVariant.findMany({
                where: {
                    colorGroupId: dto.colorGroupId,
                    deletedAt: null,
                },
                include: {
                    attributeValues: true,
                },
            });
            const newSizeOptionIds = dto.attributeValues
                .filter((av) => av.attributeOptionId)
                .map((av) => av.attributeOptionId);
            for (const existing of existingVariantsInGroup) {
                const existingOptionIds = existing.attributeValues
                    .filter((av) => av.attributeOptionId)
                    .map((av) => av.attributeOptionId);
                const hasDuplicateSize = newSizeOptionIds.some((optId) => existingOptionIds.includes(optId));
                if (hasDuplicateSize) {
                    throw new exceptions_1.BusinessException('A variant with this size option already exists in this color group.', 'DUPLICATE_VARIANT_SIZE');
                }
            }
        }
        const sku = dto.sku
            ? await this.ensureUniqueSku(dto.sku)
            : await this.generateUniqueSku();
        const barcode = dto.barcode
            ? await this.ensureUniqueBarcode(dto.barcode)
            : await this.generateUniqueBarcode();
        const title = dto.title ?? sku;
        if (dto.isDefault) {
            await this.variantsRepository.clearDefaultForProduct(dto.productId);
        }
        const variant = await this.variantsRepository.create({
            product: { connect: { id: dto.productId } },
            ...(dto.colorGroupId
                ? { colorGroup: { connect: { id: dto.colorGroupId } } }
                : {}),
            sku,
            barcode,
            title,
            priceOverride: dto.priceOverride,
            salePriceOverride: dto.salePriceOverride,
            costPrice: dto.costPrice,
            weight: dto.weight,
            length: dto.length,
            width: dto.width,
            height: dto.height,
            displayOrder: dto.displayOrder ?? 0,
            isDefault: dto.isDefault ?? false,
            createdBy: userId,
        });
        if (dto.attributeValues?.length) {
            await this.variantsRepository.assignAttributeValues(variant.id, dto.attributeValues);
        }
        await this.auditService.log({
            action: 'VARIANT_CREATED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: variant.id,
            userId,
            newValue: { productId: dto.productId, sku },
        });
        this.loggerService.log({ action: 'variant_created', variantId: variant.id }, 'ProductVariantsService');
        return this.findById(variant.id);
    }
    async update(id, dto, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        if (dto.isDefault && !variant.isDefault) {
            await this.variantsRepository.clearDefaultForProduct(variant.productId);
        }
        let updateBarcode = dto.barcode;
        if (dto.barcode && dto.barcode !== variant.barcode) {
            updateBarcode = await this.ensureUniqueBarcode(dto.barcode);
        }
        const { barcode, ...restDto } = dto;
        await this.variantsRepository.update(id, {
            ...restDto,
            ...(updateBarcode ? { barcode: updateBarcode } : {}),
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'VARIANT_UPDATED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
            newValue: { ...dto },
        });
        return this.findById(id);
    }
    async delete(id, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        await this.variantsRepository.softDelete(id);
        await this.auditService.log({
            action: 'VARIANT_DELETED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
        });
    }
    async restore(id, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        if (!variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant is not deleted', 'VARIANT_002');
        await this.variantsRepository.restore(id);
        await this.auditService.log({
            action: 'VARIANT_RESTORED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
        });
        return this.findById(id);
    }
    async activate(id, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        await this.variantsRepository.update(id, {
            isActive: true,
            status: 'ACTIVE',
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'VARIANT_ACTIVATED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
        });
        return this.findById(id);
    }
    async deactivate(id, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        await this.variantsRepository.update(id, {
            isActive: false,
            status: 'INACTIVE',
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'VARIANT_DEACTIVATED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
        });
        return this.findById(id);
    }
    async setDefault(id, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        await this.variantsRepository.clearDefaultForProduct(variant.productId);
        await this.variantsRepository.update(id, {
            isDefault: true,
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'VARIANT_DEFAULT_CHANGED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
        });
        return this.findById(id);
    }
    async assignAttributeValues(id, dto, userId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        await this.variantsRepository.assignAttributeValues(id, dto.attributeValues);
        await this.auditService.log({
            action: 'ATTRIBUTE_VALUE_ASSIGNED',
            module: 'product-variants',
            resource: 'variant',
            resourceId: id,
            userId,
            newValue: { attributeValues: dto.attributeValues },
        });
        return this.findById(id);
    }
    async removeAttributeValue(id, attributeId) {
        const variant = await this.variantsRepository.findById(id);
        if (!variant || variant.deletedAt)
            throw new exceptions_1.BusinessException('Variant not found', 'VARIANT_001');
        await this.variantsRepository.removeAttributeValue(id, attributeId);
        return this.findById(id);
    }
};
exports.ProductVariantsService = ProductVariantsService;
exports.ProductVariantsService = ProductVariantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        product_variants_repository_1.ProductVariantsRepository,
        products_repository_1.ProductsRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService])
], ProductVariantsService);
//# sourceMappingURL=product-variants.service.js.map