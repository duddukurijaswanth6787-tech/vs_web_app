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
exports.CmsService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const cms_repository_1 = require("./cms.repository");
let CmsService = class CmsService {
    cmsRepository;
    auditService;
    loggerService;
    storageService;
    constructor(cmsRepository, auditService, loggerService, storageService) {
        this.cmsRepository = cmsRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
        this.storageService = storageService;
    }
    toBannerResponse(b) {
        return {
            id: b.id,
            title: b.title,
            description: b.description ?? undefined,
            imageUrl: b.imageUrl,
            mobileImageUrl: b.mobileImageUrl ?? undefined,
            linkUrl: b.linkUrl ?? undefined,
            placement: b.placement,
            displayOrder: b.displayOrder,
            isActive: b.isActive,
            ctaEnabled: b.ctaEnabled ?? true,
            ctaStyle: b.ctaStyle ?? 'solid',
            startDate: b.startDate ?? undefined,
            endDate: b.endDate ?? undefined,
            createdAt: b.createdAt,
        };
    }
    toPageResponse(p) {
        return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            content: p.content ?? undefined,
            metaTitle: p.metaTitle ?? undefined,
            metaDescription: p.metaDescription ?? undefined,
            status: p.status,
            createdAt: p.createdAt,
        };
    }
    toSectionResponse(s) {
        return {
            id: s.id,
            name: s.name,
            slug: s.slug,
            type: s.type,
            content: s.content ?? undefined,
            displayOrder: s.displayOrder,
            isActive: s.isActive,
            createdAt: s.createdAt,
        };
    }
    async findBanners(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.cmsRepository.findBanners({
            placement: query.placement,
            isActive: query.isActive,
            page,
            limit,
        });
        return {
            data: result.data.map((b) => this.toBannerResponse(b)),
            meta: result.meta,
        };
    }
    async findBannerById(id) {
        const banner = await this.cmsRepository.findBannerById(id);
        if (!banner || banner.deletedAt)
            throw new exceptions_1.BusinessException('Banner not found', 'BANNER_001');
        return this.toBannerResponse(banner);
    }
    async createBanner(dto, userId) {
        const bannerInput = dto;
        const banner = await this.cmsRepository.createBanner({
            title: bannerInput.title,
            description: bannerInput.description,
            imageUrl: this.storageService.sanitizeUrl(bannerInput.imageUrl),
            mobileImageUrl: this.storageService.sanitizeUrl(bannerInput.mobileImageUrl),
            linkUrl: bannerInput.linkUrl,
            placement: bannerInput.placement,
            displayOrder: bannerInput.displayOrder ?? 0,
            isActive: bannerInput.isActive ?? true,
            ctaEnabled: bannerInput.ctaEnabled ?? true,
            ctaStyle: bannerInput.ctaStyle ?? 'solid',
            startDate: bannerInput.startDate
                ? new Date(bannerInput.startDate)
                : undefined,
            endDate: bannerInput.endDate ? new Date(bannerInput.endDate) : undefined,
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'BANNER_CREATED',
            module: 'cms',
            resource: 'banner',
            resourceId: banner.id,
            userId,
            newValue: { title: dto.title, placement: dto.placement },
        });
        this.loggerService.log({ action: 'banner_created', bannerId: banner.id, title: dto.title }, 'CmsService');
        return this.toBannerResponse(banner);
    }
    async updateBanner(id, dto, userId) {
        const banner = await this.cmsRepository.findBannerById(id);
        if (!banner || banner.deletedAt)
            throw new exceptions_1.BusinessException('Banner not found', 'BANNER_001');
        const updateData = { ...dto, updatedBy: userId };
        if (dto.imageUrl)
            updateData.imageUrl = this.storageService.sanitizeUrl(dto.imageUrl);
        if (dto.mobileImageUrl)
            updateData.mobileImageUrl = this.storageService.sanitizeUrl(dto.mobileImageUrl);
        if (dto.startDate)
            updateData.startDate = new Date(dto.startDate);
        if (dto.endDate)
            updateData.endDate = new Date(dto.endDate);
        await this.cmsRepository.updateBanner(id, updateData);
        await this.auditService.log({
            action: 'CMS_UPDATED',
            module: 'cms',
            resource: 'banner',
            resourceId: id,
            userId,
            oldValue: { title: banner.title },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'banner_updated', bannerId: id }, 'CmsService');
        const updated = await this.cmsRepository.findBannerById(id);
        return this.toBannerResponse(updated);
    }
    async deleteBanner(id, userId) {
        const banner = await this.cmsRepository.findBannerById(id);
        if (!banner || banner.deletedAt)
            throw new exceptions_1.BusinessException('Banner not found', 'BANNER_001');
        await this.cmsRepository.updateBanner(id, {
            deletedAt: new Date(),
            isActive: false,
        });
        await this.auditService.log({
            action: 'CMS_UPDATED',
            module: 'cms',
            resource: 'banner',
            resourceId: id,
            userId,
            oldValue: { title: banner.title },
        });
        this.loggerService.log({ action: 'banner_deleted', bannerId: id }, 'CmsService');
    }
    async findPages(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.cmsRepository.findPages({
            search: query.search,
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((p) => this.toPageResponse(p)),
            meta: result.meta,
        };
    }
    async findPageBySlug(slug) {
        const page = await this.cmsRepository.findPageBySlug(slug);
        if (!page || page.deletedAt)
            throw new exceptions_1.BusinessException('Page not found', 'PAGE_001');
        return this.toPageResponse(page);
    }
    async createPage(dto, userId) {
        const existing = await this.cmsRepository.findPageBySlug(dto.slug);
        if (existing)
            throw new exceptions_1.BusinessException('Slug already exists', 'PAGE_002');
        const page = await this.cmsRepository.createPage({
            title: dto.title,
            slug: dto.slug,
            content: dto.content,
            metaTitle: dto.metaTitle,
            metaDescription: dto.metaDescription,
            status: dto.status ?? 'DRAFT',
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'CMS_UPDATED',
            module: 'cms',
            resource: 'page',
            resourceId: page.id,
            userId,
            newValue: { title: dto.title, slug: dto.slug },
        });
        this.loggerService.log({ action: 'page_created', pageId: page.id, title: dto.title }, 'CmsService');
        return this.toPageResponse(page);
    }
    async updatePage(id, dto, userId) {
        const existing = await this.cmsRepository.findPageById(id);
        if (!existing || existing.deletedAt)
            throw new exceptions_1.BusinessException('Page not found', 'PAGE_001');
        const updateData = { ...dto, updatedBy: userId };
        if (dto.slug && dto.slug !== existing.slug) {
            const slugTaken = await this.cmsRepository.findPageBySlug(dto.slug);
            if (slugTaken && slugTaken.id !== id)
                throw new exceptions_1.BusinessException('Slug already exists', 'PAGE_002');
        }
        await this.cmsRepository.updatePage(id, updateData);
        await this.auditService.log({
            action: 'CMS_UPDATED',
            module: 'cms',
            resource: 'page',
            resourceId: id,
            userId,
            oldValue: { title: existing.title },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'page_updated', pageId: id }, 'CmsService');
        const updated = await this.cmsRepository.findPageById(id);
        return this.toPageResponse(updated);
    }
    async findSections() {
        const sections = await this.cmsRepository.findSections();
        return sections.map((s) => this.toSectionResponse(s));
    }
    async createSection(dto, userId) {
        const section = await this.cmsRepository.createSection({
            name: dto.name,
            slug: dto.slug,
            type: dto.type,
            content: dto.content,
            displayOrder: dto.displayOrder ?? 0,
            isActive: dto.isActive ?? true,
        });
        await this.auditService.log({
            action: 'CMS_UPDATED',
            module: 'cms',
            resource: 'section',
            resourceId: section.id,
            userId,
            newValue: { name: dto.name, slug: dto.slug },
        });
        this.loggerService.log({ action: 'section_created', sectionId: section.id, name: dto.name }, 'CmsService');
        return this.toSectionResponse(section);
    }
};
exports.CmsService = CmsService;
exports.CmsService = CmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cms_repository_1.CmsRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService,
        storage_service_1.StorageService])
], CmsService);
//# sourceMappingURL=cms.service.js.map