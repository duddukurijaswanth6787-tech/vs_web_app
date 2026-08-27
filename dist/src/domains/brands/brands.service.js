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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const commerce_utils_1 = require("../../shared/commerce/commerce.utils");
const audit_service_1 = require("../audit/audit.service");
const brands_repository_1 = require("./brands.repository");
let BrandsService = class BrandsService {
    brandsRepository;
    auditService;
    loggerService;
    constructor(brandsRepository, auditService, loggerService) {
        this.brandsRepository = brandsRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
    }
    toResponse(b) {
        return {
            id: b.id,
            name: b.name,
            slug: b.slug,
            description: b.description ?? undefined,
            logo: b.logo ?? undefined,
            bannerImage: b.bannerImage ?? undefined,
            website: b.website ?? undefined,
            displayOrder: b.displayOrder,
            isFeatured: b.isFeatured,
            isVisible: b.isVisible,
            status: b.status,
            seoTitle: b.seoTitle ?? undefined,
            seoDescription: b.seoDescription ?? undefined,
            seoKeywords: b.seoKeywords ?? undefined,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.brandsRepository.findAll({
            search: query.search,
            status: query.status,
            isFeatured: query.isFeatured,
            isVisible: query.isVisible,
            page,
            limit,
            sortBy: query.sortBy ?? 'name',
            sortOrder: query.sortOrder ?? 'asc',
        });
        return {
            data: result.data.map((b) => this.toResponse(b)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const brand = await this.brandsRepository.findById(id);
        if (!brand || brand.deletedAt)
            throw new exceptions_1.BusinessException('Brand not found', 'BRAND_001');
        return this.toResponse(brand);
    }
    async findBySlug(slug) {
        const brand = await this.brandsRepository.findBySlug(slug);
        if (!brand || brand.deletedAt)
            throw new exceptions_1.BusinessException('Brand not found', 'BRAND_001');
        return this.toResponse(brand);
    }
    async findFeatured() {
        return this.findAll({
            isFeatured: true,
            isVisible: true,
            status: 'ACTIVE',
            page: 1,
            limit: 20,
            sortBy: 'name',
            sortOrder: 'asc',
        });
    }
    async generateUniqueSlug(name, excludeId) {
        let slug = commerce_utils_1.SlugGenerator.generate(name);
        let existing = await this.brandsRepository.findBySlug(slug);
        let counter = 1;
        while (existing && existing.id !== excludeId) {
            slug = `${commerce_utils_1.SlugGenerator.generate(name)}-${counter}`;
            existing = await this.brandsRepository.findBySlug(slug);
            counter++;
        }
        return slug;
    }
    async create(dto, userId) {
        const slug = await this.generateUniqueSlug(dto.slug || dto.name);
        const brand = await this.brandsRepository.create({
            name: dto.name,
            slug,
            description: dto.description,
            logo: dto.logo,
            bannerImage: dto.bannerImage,
            website: dto.website,
            displayOrder: dto.displayOrder ?? 0,
            isFeatured: dto.isFeatured ?? true,
            isVisible: dto.isVisible ?? true,
            status: dto.status ?? 'ACTIVE',
            seoTitle: dto.seoTitle,
            seoDescription: dto.seoDescription,
            seoKeywords: dto.seoKeywords,
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'BRAND_CREATED',
            module: 'brands',
            resource: 'brand',
            resourceId: brand.id,
            userId,
            newValue: { name: dto.name, slug },
        });
        this.loggerService.log({ action: 'brand_created', brandId: brand.id, name: dto.name }, 'BrandsService');
        return this.findById(brand.id);
    }
    async update(id, dto, userId) {
        const brand = await this.brandsRepository.findById(id);
        if (!brand || brand.deletedAt)
            throw new exceptions_1.BusinessException('Brand not found', 'BRAND_001');
        const updateData = { ...dto, updatedBy: userId };
        if (dto.slug || dto.name)
            updateData.slug = await this.generateUniqueSlug(dto.slug || dto.name || '', id);
        await this.brandsRepository.update(id, updateData);
        await this.auditService.log({
            action: 'BRAND_UPDATED',
            module: 'brands',
            resource: 'brand',
            resourceId: id,
            userId,
            oldValue: { name: brand.name },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'brand_updated', brandId: id }, 'BrandsService');
        return this.findById(id);
    }
    async delete(id, userId) {
        const brand = await this.brandsRepository.findById(id);
        if (!brand || brand.deletedAt)
            throw new exceptions_1.BusinessException('Brand not found', 'BRAND_001');
        await this.brandsRepository.softDelete(id);
        await this.auditService.log({
            action: 'BRAND_DELETED',
            module: 'brands',
            resource: 'brand',
            resourceId: id,
            userId,
            oldValue: { name: brand.name },
        });
        this.loggerService.log({ action: 'brand_deleted', brandId: id }, 'BrandsService');
    }
    async restore(id, userId) {
        const brand = await this.brandsRepository.findById(id);
        if (!brand)
            throw new exceptions_1.BusinessException('Brand not found', 'BRAND_001');
        if (!brand.deletedAt)
            throw new exceptions_1.BusinessException('Brand is not deleted', 'BRAND_002');
        await this.brandsRepository.restore(id);
        await this.auditService.log({
            action: 'BRAND_RESTORED',
            module: 'brands',
            resource: 'brand',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'brand_restored', brandId: id }, 'BrandsService');
        return this.findById(id);
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [brands_repository_1.BrandsRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map