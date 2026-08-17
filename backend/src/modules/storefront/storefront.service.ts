import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { CacheService } from '@infrastructure/redis';
import { BusinessException } from '@common/exceptions';
import {
  UpdateWebsiteSettingDto,
  UpdateHomepageSectionDto,
  CreateHomepageCategoryDto,
  ReorderDto,
  UpdateSocialLinkDto,
  CreateFooterLinkDto,
  UpdateFooterLinkDto,
  UpdateFeatureToggleDto,
  BulkFeatureToggleDto,
  NewsletterQueryDto,
} from './storefront.types';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
  ) {}

  async getSettings() {
    const settings = await this.prisma.websiteSetting.findFirst({
      where: { deletedAt: null },
    });
    if (!settings)
      throw new BusinessException('Website settings not found', 'STF_001');
    return settings;
  }

  async updateSettings(dto: UpdateWebsiteSettingDto, userId: string) {
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
    return updated;
  }

  async getHomepage() {
    return this.prisma.homepageSection.findMany({
      where: { deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateHomepage(
    sections: { key: string; data: UpdateHomepageSectionDto }[],
    userId: string,
  ) {
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
      newValue: results as any,
    });
    await this.cache.del('storefront:homepage');
    return results;
  }

  async reorderHomepage(dto: ReorderDto) {
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

  async addHomepageCategory(dto: CreateHomepageCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BusinessException('Category not found', 'STF_002');
    const existing = await this.prisma.homepageCategory.findFirst({
      where: { categoryId: dto.categoryId },
    });
    if (existing)
      throw new BusinessException(
        'Category already added to homepage',
        'STF_003',
      );
    const maxOrder = await this.prisma.homepageCategory.aggregate({
      _max: { displayOrder: true },
    });
    return this.prisma.homepageCategory.create({
      data: { ...dto, displayOrder: (maxOrder._max.displayOrder ?? 0) + 1 },
      include: { category: true },
    });
  }

  async removeHomepageCategory(id: string) {
    const item = await this.prisma.homepageCategory.findUnique({
      where: { id },
    });
    if (!item)
      throw new BusinessException('Homepage category not found', 'STF_004');
    await this.prisma.homepageCategory.delete({ where: { id } });
  }

  async reorderHomepageCategories(dto: ReorderDto) {
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

  async updateFeature(key: string, dto: UpdateFeatureToggleDto) {
    const existing = await this.prisma.featureToggle.findUnique({
      where: { key },
    });
    if (!existing)
      throw new BusinessException(`Feature "${key}" not found`, 'STF_005');
    return this.prisma.featureToggle.update({
      where: { key },
      data: { enabled: dto.enabled },
    });
  }

  async bulkUpdateFeatures(dto: BulkFeatureToggleDto, userId: string) {
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

  async addFooterLink(dto: CreateFooterLinkDto) {
    const section = await this.prisma.footerSection.findUnique({
      where: { id: dto.footerSectionId },
    });
    if (!section)
      throw new BusinessException('Footer section not found', 'STF_006');
    return this.prisma.footerLink.create({ data: dto });
  }

  async updateFooterLink(id: string, dto: UpdateFooterLinkDto) {
    const link = await this.prisma.footerLink.findUnique({ where: { id } });
    if (!link) throw new BusinessException('Footer link not found', 'STF_007');
    return this.prisma.footerLink.update({ where: { id }, data: dto });
  }

  async deleteFooterLink(id: string) {
    const link = await this.prisma.footerLink.findUnique({ where: { id } });
    if (!link) throw new BusinessException('Footer link not found', 'STF_007');
    await this.prisma.footerLink.delete({ where: { id } });
  }

  async getSocialLinks() {
    return this.prisma.socialLink.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateSocialLink(platform: string, dto: UpdateSocialLinkDto) {
    const link = await this.prisma.socialLink.findUnique({
      where: { platform: platform as any },
    });
    if (!link)
      throw new BusinessException(
        `Social link "${platform}" not found`,
        'STF_008',
      );
    return this.prisma.socialLink.update({
      where: { platform: platform as any },
      data: dto,
    });
  }

  async getNewsletters(query: NewsletterQueryDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
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

  async removeNewsletter(id: string) {
    const sub = await this.prisma.newsletterSubscription.findUnique({
      where: { id },
    });
    if (!sub)
      throw new BusinessException(
        'Newsletter subscription not found',
        'STF_009',
      );
    await this.prisma.newsletterSubscription.delete({ where: { id } });
  }

  async exportNewsletters() {
    return this.prisma.newsletterSubscription.findMany({
      where: { status: 'SUBSCRIBED' },
      select: { email: true, subscribedAt: true, source: true },
      orderBy: { subscribedAt: 'desc' },
    });
  }
}
