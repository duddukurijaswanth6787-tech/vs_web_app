import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { SlugGenerator } from '@shared/commerce/commerce.utils';
import { AuditService } from '@domains/audit/audit.service';
import { CategoriesRepository } from './categories.repository';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  MoveCategoryDto,
  ReorderCategoriesDto,
  CategoryQueryDto,
  CategoryResponse,
  CategoryTreeNode,
} from './categories.types';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  private toResponse(cat: any): CategoryResponse {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? undefined,
      icon: cat.icon ?? undefined,
      image: cat.image ?? undefined,
      bannerImage: cat.bannerImage ?? undefined,
      parentId: cat.parentId ?? undefined,
      level: cat.level,
      path: cat.path,
      displayOrder: cat.displayOrder,
      isFeatured: cat.isFeatured,
      isVisible: cat.isVisible,
      isMenuVisible: cat.isMenuVisible,
      seoTitle: cat.seoTitle ?? undefined,
      seoDescription: cat.seoDescription ?? undefined,
      seoKeywords: cat.seoKeywords ?? undefined,
      status: cat.status,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    };
  }

  async findAll(query: CategoryQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.categoriesRepository.findAll({
      search: query.search,
      status: query.status,
      isFeatured: query.isFeatured,
      isMenuVisible: query.isMenuVisible,
      isVisible: query.isVisible,
      page,
      limit,
      sortBy: query.sortBy ?? 'displayOrder',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: result.data.map((c) => this.toResponse(c)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    return this.toResponse(cat);
  }

  async findBySlug(slug: string) {
    const cat = await this.categoriesRepository.findBySlug(slug);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    return this.toResponse(cat);
  }

  async findFeatured() {
    return this.findAll({
      isFeatured: true,
      isVisible: true,
      status: 'ACTIVE',
      page: 1,
      limit: 20,
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });
  }

  async findChildren(id: string) {
    const children = await this.categoriesRepository.findChildren(id);
    return children.map((c) => this.toResponse(c));
  }

  async findAncestors(id: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    if (!cat.path) return [];
    const ancestorIds = cat.path.split('/').filter(Boolean);
    if (!ancestorIds.length) return [];
    const ancestors = await this.categoriesRepository.findByIds(ancestorIds);
    // ponytail: preserve path order since findMany doesn't guarantee it
    const orderMap = new Map(ancestorIds.map((aid, i) => [aid, i]));
    ancestors.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );
    return ancestors.map((a) => this.toResponse(a));
  }

  async getTree(): Promise<CategoryTreeNode[]> {
    const all = await this.categoriesRepository.findAllActive();
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const cat of all) {
      map.set(cat.id, { ...this.toResponse(cat), children: [] });
    }
    for (const cat of all) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = SlugGenerator.generate(name);
    let existing = await this.categoriesRepository.findBySlug(slug);
    let counter = 1;
    while (existing && existing.id !== excludeId) {
      slug = `${SlugGenerator.generate(name)}-${counter}`;
      existing = await this.categoriesRepository.findBySlug(slug);
      counter++;
    }
    return slug;
  }

  async create(dto: CreateCategoryDto, userId: string) {
    const slug = await this.generateUniqueSlug(dto.slug || dto.name);
    let level = 0;
    let path = '';

    if (dto.parentId) {
      const parent = await this.categoriesRepository.findById(dto.parentId);
      if (!parent || parent.deletedAt)
        throw new BusinessException('Parent category not found', 'CAT_002');
      level = parent.level + 1;
    }

    const cat = await this.categoriesRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      icon: dto.icon,
      image: dto.image,
      bannerImage: dto.bannerImage,
      parentId: dto.parentId,
      level,
      displayOrder: dto.displayOrder ?? 0,
      isFeatured: dto.isFeatured ?? true,
      isVisible: dto.isVisible ?? true,
      isMenuVisible: dto.isMenuVisible ?? true,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      seoKeywords: dto.seoKeywords,
      status: dto.status ?? 'ACTIVE',
      createdBy: userId,
    } as any);

    // ponytail: update path after create since we need the new id
    path = dto.parentId ? `${dto.parentId}/${cat.id}` : cat.id;
    await this.categoriesRepository.update(cat.id, { path });

    await this.auditService.log({
      action: 'CATEGORY_CREATED',
      module: 'categories',
      resource: 'category',
      resourceId: cat.id,
      userId,
      newValue: { name: dto.name, slug, parentId: dto.parentId },
    });
    this.loggerService.log(
      { action: 'category_created', categoryId: cat.id, name: dto.name },
      'CategoriesService',
    );
    return this.findById(cat.id);
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');

    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.slug || dto.name) {
      updateData.slug = await this.generateUniqueSlug(
        dto.slug || dto.name || '',
        id,
      );
    }

    await this.categoriesRepository.update(id, updateData);

    await this.auditService.log({
      action: 'CATEGORY_UPDATED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
      oldValue: { name: cat.name },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'category_updated', categoryId: id },
      'CategoriesService',
    );
    return this.findById(id);
  }

  async move(id: string, dto: MoveCategoryDto, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    if (id === dto.newParentId)
      throw new BusinessException('Cannot move category to itself', 'CAT_003');

    const newParent = await this.categoriesRepository.findById(dto.newParentId);
    if (!newParent || newParent.deletedAt)
      throw new BusinessException('Target parent not found', 'CAT_004');

    const oldParentId = cat.parentId;
    const newLevel = newParent.level + 1;
    const levelDiff = newLevel - cat.level;
    const newPath = `${newParent.path}/${cat.id}`.replace(/^\//, '');

    await this.categoriesRepository.update(id, {
      parentId: dto.newParentId,
      level: newLevel,
      path: newPath,
      updatedBy: userId,
    } as any);

    // ponytail: update descendants' path and level
    const descendants = await this.categoriesRepository.findDescendants(
      `${cat.path}/`,
    );
    for (const desc of descendants) {
      const descNewPath = desc.path.replace(cat.path, newPath);
      const descNewLevel = desc.level + levelDiff;
      await this.categoriesRepository.update(desc.id, {
        path: descNewPath,
        level: descNewLevel,
      });
    }

    await this.auditService.log({
      action: 'CATEGORY_MOVED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
      oldValue: { parentId: oldParentId },
      newValue: { parentId: dto.newParentId },
    });
    this.loggerService.log(
      {
        action: 'category_moved',
        categoryId: id,
        newParentId: dto.newParentId,
      },
      'CategoriesService',
    );
    return this.findById(id);
  }

  async reorder(dto: ReorderCategoriesDto, userId: string) {
    for (const item of dto.items) {
      await this.categoriesRepository.update(item.id, {
        displayOrder: item.displayOrder,
        updatedBy: userId,
      });
    }
    await this.auditService.log({
      action: 'CATEGORY_REORDERED',
      module: 'categories',
      resource: 'category',
      userId,
      metadata: { count: dto.items.length },
    });
    this.loggerService.log(
      { action: 'categories_reordered', count: dto.items.length },
      'CategoriesService',
    );
  }

  async delete(id: string, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');

    const childrenCount = await this.categoriesRepository.countByParentId(id);
    // ponytail: prevent deletion if children exist — force reassign first
    if (childrenCount > 0)
      throw new BusinessException(
        'Category has children. Move or delete them first.',
        'CAT_005',
      );

    await this.categoriesRepository.softDelete(id);

    await this.auditService.log({
      action: 'CATEGORY_DELETED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
      oldValue: { name: cat.name },
    });
    this.loggerService.log(
      { action: 'category_deleted', categoryId: id },
      'CategoriesService',
    );
  }

  async restore(id: string, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat) throw new BusinessException('Category not found', 'CAT_001');
    if (!cat.deletedAt)
      throw new BusinessException('Category is not deleted', 'CAT_006');

    if (cat.parentId) {
      const parent = await this.categoriesRepository.findById(cat.parentId);
      if (!parent || parent.deletedAt)
        throw new BusinessException(
          'Parent category is deleted. Restore parent first.',
          'CAT_007',
        );
    }

    await this.categoriesRepository.restore(id);

    await this.auditService.log({
      action: 'CATEGORY_RESTORED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'category_restored', categoryId: id },
      'CategoriesService',
    );
    return this.findById(id);
  }
}
