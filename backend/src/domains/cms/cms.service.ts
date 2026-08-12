import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CmsRepository } from './cms.repository';
import {
  CreateBannerDto,
  UpdateBannerDto,
  BannerQueryDto,
  BannerResponse,
  CreateCmsPageDto,
  UpdateCmsPageDto,
  CmsPageQueryDto,
  CmsPageResponse,
  CreateCmsSectionDto,
  CmsSectionResponse,
} from './cms.types';

@Injectable()
export class CmsService {
  constructor(
    private readonly cmsRepository: CmsRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  private toBannerResponse(b: any): BannerResponse {
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
      startDate: b.startDate ?? undefined,
      endDate: b.endDate ?? undefined,
      createdAt: b.createdAt,
    };
  }

  private toPageResponse(p: any): CmsPageResponse {
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

  private toSectionResponse(s: any): CmsSectionResponse {
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

  async findBanners(query: BannerQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.cmsRepository.findBanners({
      placement: query.placement,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      data: result.data.map((b: any) => this.toBannerResponse(b)),
      meta: result.meta,
    };
  }

  async findBannerById(id: string) {
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner || banner.deletedAt)
      throw new BusinessException('Banner not found', 'BANNER_001');
    return this.toBannerResponse(banner);
  }

  async createBanner(dto: CreateBannerDto, userId: string) {
    const bannerInput = dto as any;
    const banner = await this.cmsRepository.createBanner({
      title: bannerInput.title,
      description: bannerInput.description,
      imageUrl: bannerInput.imageUrl,
      linkUrl: bannerInput.linkUrl,
      placement: bannerInput.placement,
      displayOrder: bannerInput.displayOrder ?? 0,
      isActive: bannerInput.isActive ?? true,
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
    this.loggerService.log(
      { action: 'banner_created', bannerId: banner.id, title: dto.title },
      'CmsService',
    );
    return this.toBannerResponse(banner);
  }

  async updateBanner(id: string, dto: UpdateBannerDto, userId: string) {
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner || banner.deletedAt)
      throw new BusinessException('Banner not found', 'BANNER_001');
    const updateData: any = { ...dto, updatedBy: userId };
    delete updateData.mobileImageUrl;
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
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
    this.loggerService.log(
      { action: 'banner_updated', bannerId: id },
      'CmsService',
    );
    const updated = await this.cmsRepository.findBannerById(id);
    return this.toBannerResponse(updated);
  }

  async deleteBanner(id: string, userId: string) {
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner || banner.deletedAt)
      throw new BusinessException('Banner not found', 'BANNER_001');
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
    this.loggerService.log(
      { action: 'banner_deleted', bannerId: id },
      'CmsService',
    );
  }

  async findPages(query: CmsPageQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.cmsRepository.findPages({
      search: query.search,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((p: any) => this.toPageResponse(p)),
      meta: result.meta,
    };
  }

  async findPageBySlug(slug: string) {
    const page = await this.cmsRepository.findPageBySlug(slug);
    if (!page || page.deletedAt)
      throw new BusinessException('Page not found', 'PAGE_001');
    return this.toPageResponse(page);
  }

  async createPage(dto: CreateCmsPageDto, userId: string) {
    const existing = await this.cmsRepository.findPageBySlug(dto.slug);
    if (existing)
      throw new BusinessException('Slug already exists', 'PAGE_002');
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
    this.loggerService.log(
      { action: 'page_created', pageId: page.id, title: dto.title },
      'CmsService',
    );
    return this.toPageResponse(page);
  }

  async updatePage(id: string, dto: UpdateCmsPageDto, userId: string) {
    const existing = await this.cmsRepository.findPageById(id);
    if (!existing || existing.deletedAt)
      throw new BusinessException('Page not found', 'PAGE_001');
    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.cmsRepository.findPageBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== id)
        throw new BusinessException('Slug already exists', 'PAGE_002');
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
    this.loggerService.log(
      { action: 'page_updated', pageId: id },
      'CmsService',
    );
    const updated = await this.cmsRepository.findPageById(id);
    return this.toPageResponse(updated);
  }

  async findSections() {
    const sections = await this.cmsRepository.findSections();
    return sections.map((s: any) => this.toSectionResponse(s));
  }

  async createSection(dto: CreateCmsSectionDto, userId: string) {
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
    this.loggerService.log(
      { action: 'section_created', sectionId: section.id, name: dto.name },
      'CmsService',
    );
    return this.toSectionResponse(section);
  }
}
