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
exports.StorefrontService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../../domains/audit/audit.service");
const redis_1 = require("../../infrastructure/redis");
const exceptions_1 = require("../../common/exceptions");
let StorefrontService = class StorefrontService {
    prisma;
    auditService;
    cache;
    constructor(prisma, auditService, cache) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.cache = cache;
    }
    async getSettings() {
        const settings = await this.prisma.websiteSetting.findFirst({
            where: { deletedAt: null },
        });
        if (settings)
            return settings;
        return this.prisma.websiteSetting.create({ data: {} });
    }
    async updateSettings(dto, userId) {
        const existing = await this.getSettings();
        const updated = await this.prisma.websiteSetting.update({
            where: { id: existing.id },
            data: dto,
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            module: 'STOREFRONT',
            resource: 'SETTINGS',
            resourceId: existing.id,
            oldValue: existing,
            newValue: updated,
        });
        await this.cache.del('storefront:settings');
        return updated;
    }
    async getHomepage() {
        return this.prisma.homepageSection.findMany({
            where: { deletedAt: null },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async updateHomepage(sections, userId) {
        const results = [];
        for (const { key, data } of sections) {
            const updated = await this.prisma.homepageSection.update({
                where: { key },
                data,
            });
            results.push(updated);
        }
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            module: 'STOREFRONT',
            resource: 'HOMEPAGE_SECTIONS',
            resourceId: 'bulk',
            newValue: results,
        });
        await this.cache.del('storefront:homepage');
        return results;
    }
    async reorderHomepage(dto) {
        for (let i = 0; i < dto.order.length; i++) {
            await this.prisma.homepageSection.update({
                where: { key: dto.order[i] },
                data: { displayOrder: i },
            });
        }
        await this.cache.del('storefront:homepage');
        return this.getHomepage();
    }
    async getHomepageCategories() {
        return this.prisma.homepageCategory.findMany({
            orderBy: { displayOrder: 'asc' },
            include: { category: true },
        });
    }
    async addHomepageCategory(dto) {
        const category = await this.prisma.category.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category)
            throw new exceptions_1.BusinessException('Category not found', 'STF_002');
        const existing = await this.prisma.homepageCategory.findFirst({
            where: { categoryId: dto.categoryId },
        });
        if (existing)
            throw new exceptions_1.BusinessException('Category already added to homepage', 'STF_003');
        const maxOrder = await this.prisma.homepageCategory.aggregate({
            _max: { displayOrder: true },
        });
        return this.prisma.homepageCategory.create({
            data: { ...dto, displayOrder: (maxOrder._max.displayOrder ?? 0) + 1 },
            include: { category: true },
        });
    }
    async removeHomepageCategory(id) {
        const item = await this.prisma.homepageCategory.findUnique({
            where: { id },
        });
        if (!item)
            throw new exceptions_1.BusinessException('Homepage category not found', 'STF_004');
        await this.prisma.homepageCategory.delete({ where: { id } });
    }
    async reorderHomepageCategories(dto) {
        for (let i = 0; i < dto.order.length; i++) {
            await this.prisma.homepageCategory.update({
                where: { id: dto.order[i] },
                data: { displayOrder: i },
            });
        }
        return this.getHomepageCategories();
    }
    async getFeatures() {
        return this.prisma.featureToggle.findMany({ orderBy: { category: 'asc' } });
    }
    async updateFeature(key, dto) {
        const existing = await this.prisma.featureToggle.findUnique({
            where: { key },
        });
        if (!existing)
            throw new exceptions_1.BusinessException(`Feature "${key}" not found`, 'STF_005');
        return this.prisma.featureToggle.update({
            where: { key },
            data: { enabled: dto.enabled },
        });
    }
    async bulkUpdateFeatures(dto, userId) {
        await this.prisma.featureToggle.updateMany({
            where: { key: { in: dto.enable } },
            data: { enabled: true },
        });
        await this.prisma.featureToggle.updateMany({
            where: { key: { in: dto.disable } },
            data: { enabled: false },
        });
        const toggles = await this.getFeatures();
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            module: 'STOREFRONT',
            resource: 'FEATURE_TOGGLES',
            resourceId: 'bulk',
            newValue: { enable: dto.enable, disable: dto.disable },
        });
        return toggles;
    }
    async getFooter() {
        return this.prisma.footerSection.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                links: { where: { enabled: true }, orderBy: { displayOrder: 'asc' } },
            },
        });
    }
    async getFooterAdmin() {
        return this.prisma.footerSection.findMany({
            orderBy: { displayOrder: 'asc' },
            include: { links: { orderBy: { displayOrder: 'asc' } } },
        });
    }
    async addFooterLink(dto) {
        const section = await this.prisma.footerSection.findUnique({
            where: { id: dto.footerSectionId },
        });
        if (!section)
            throw new exceptions_1.BusinessException('Footer section not found', 'STF_006');
        return this.prisma.footerLink.create({ data: dto });
    }
    async updateFooterLink(id, dto) {
        const link = await this.prisma.footerLink.findUnique({ where: { id } });
        if (!link)
            throw new exceptions_1.BusinessException('Footer link not found', 'STF_007');
        return this.prisma.footerLink.update({ where: { id }, data: dto });
    }
    async deleteFooterLink(id) {
        const link = await this.prisma.footerLink.findUnique({ where: { id } });
        if (!link)
            throw new exceptions_1.BusinessException('Footer link not found', 'STF_007');
        await this.prisma.footerLink.delete({ where: { id } });
    }
    async getSocialLinks() {
        return this.prisma.socialLink.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }
    async updateSocialLink(platform, dto) {
        const link = await this.prisma.socialLink.findUnique({
            where: { platform: platform },
        });
        if (!link)
            throw new exceptions_1.BusinessException(`Social link "${platform}" not found`, 'STF_008');
        return this.prisma.socialLink.update({
            where: { platform: platform },
            data: dto,
        });
    }
    async getNewsletters(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        const page = query.page || 1;
        const limit = query.limit || 20;
        const [data, total] = await Promise.all([
            this.prisma.newsletterSubscription.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.newsletterSubscription.count({ where }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
        };
    }
    async removeNewsletter(id) {
        const sub = await this.prisma.newsletterSubscription.findUnique({
            where: { id },
        });
        if (!sub)
            throw new exceptions_1.BusinessException('Newsletter subscription not found', 'STF_009');
        await this.prisma.newsletterSubscription.delete({ where: { id } });
    }
    async exportNewsletters() {
        return this.prisma.newsletterSubscription.findMany({
            where: { status: 'SUBSCRIBED' },
            select: { email: true, subscribedAt: true, source: true },
            orderBy: { subscribedAt: 'desc' },
        });
    }
    async getFeatureToggles() {
        return this.prisma.featureToggle.findMany({
            orderBy: { key: 'asc' },
        });
    }
    async updateFeatureToggle(key, enabled) {
        return this.prisma.featureToggle.upsert({
            where: { key },
            update: { enabled },
            create: {
                key,
                name: key.replace(/_/g, ' ').toUpperCase(),
                enabled,
                category: 'CUSTOMER',
            },
        });
    }
    async getPublicFeatureToggles() {
        const toggles = await this.prisma.featureToggle.findMany();
        const result = {};
        for (const t of toggles) {
            result[t.key] = t.enabled;
        }
        return result;
    }
};
exports.StorefrontService = StorefrontService;
exports.StorefrontService = StorefrontService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        redis_1.CacheService])
], StorefrontService);
//# sourceMappingURL=storefront.service.js.map