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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const commerce_utils_1 = require("../../shared/commerce/commerce.utils");
const audit_service_1 = require("../audit/audit.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const categories_repository_1 = require("./categories.repository");
let CategoriesService = class CategoriesService {
    categoriesRepository;
    auditService;
    loggerService;
    storageService;
    constructor(categoriesRepository, auditService, loggerService, storageService) {
        this.categoriesRepository = categoriesRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
        this.storageService = storageService;
    }
    toResponse(cat) {
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
    async findAll(query) {
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
    async findById(id) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat || cat.deletedAt)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        return this.toResponse(cat);
    }
    async findBySlug(slug) {
        const cat = await this.categoriesRepository.findBySlug(slug);
        if (!cat || cat.deletedAt)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        return this.toResponse(cat);
    }
    async findFeatured() {
        const featured = await this.findAll({
            isFeatured: true,
            isVisible: true,
            status: 'ACTIVE',
            page: 1,
            limit: 20,
            sortBy: 'displayOrder',
            sortOrder: 'asc',
        });
        if (featured.data && featured.data.length > 0) {
            return featured;
        }
        return this.findAll({
            isVisible: true,
            status: 'ACTIVE',
            page: 1,
            limit: 20,
            sortBy: 'displayOrder',
            sortOrder: 'asc',
        });
    }
    async findChildren(id) {
        const children = await this.categoriesRepository.findChildren(id);
        return children.map((c) => this.toResponse(c));
    }
    async findAncestors(id) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat || cat.deletedAt)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        if (!cat.path)
            return [];
        const ancestorIds = cat.path.split('/').filter(Boolean);
        if (!ancestorIds.length)
            return [];
        const ancestors = await this.categoriesRepository.findByIds(ancestorIds);
        const orderMap = new Map(ancestorIds.map((aid, i) => [aid, i]));
        ancestors.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
        return ancestors.map((a) => this.toResponse(a));
    }
    async getTree() {
        const all = await this.categoriesRepository.findAllActive();
        const map = new Map();
        const roots = [];
        for (const cat of all) {
            map.set(cat.id, { ...this.toResponse(cat), children: [] });
        }
        for (const cat of all) {
            const node = map.get(cat.id);
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId).children.push(node);
            }
            else {
                roots.push(node);
            }
        }
        return roots;
    }
    async generateUniqueSlug(name, excludeId) {
        let slug = commerce_utils_1.SlugGenerator.generate(name);
        let existing = await this.categoriesRepository.findBySlug(slug);
        let counter = 1;
        while (existing && existing.id !== excludeId) {
            slug = `${commerce_utils_1.SlugGenerator.generate(name)}-${counter}`;
            existing = await this.categoriesRepository.findBySlug(slug);
            counter++;
        }
        return slug;
    }
    async create(dto, userId) {
        const slug = await this.generateUniqueSlug(dto.slug || dto.name);
        let level = 0;
        let path = '';
        if (dto.parentId) {
            const parent = await this.categoriesRepository.findById(dto.parentId);
            if (!parent || parent.deletedAt)
                throw new exceptions_1.BusinessException('Parent category not found', 'CAT_002');
            level = parent.level + 1;
        }
        const cat = await this.categoriesRepository.create({
            name: dto.name,
            slug,
            description: dto.description,
            icon: this.storageService.sanitizeUrl(dto.icon),
            image: this.storageService.sanitizeUrl(dto.image),
            bannerImage: this.storageService.sanitizeUrl(dto.bannerImage),
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
        });
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
        this.loggerService.log({ action: 'category_created', categoryId: cat.id, name: dto.name }, 'CategoriesService');
        return this.findById(cat.id);
    }
    async update(id, dto, userId) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat || cat.deletedAt)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        const updateData = { ...dto, updatedBy: userId };
        if (dto.slug || dto.name) {
            updateData.slug = await this.generateUniqueSlug(dto.slug || dto.name || '', id);
        }
        if (dto.icon)
            updateData.icon = this.storageService.sanitizeUrl(dto.icon);
        if (dto.image)
            updateData.image = this.storageService.sanitizeUrl(dto.image);
        if (dto.bannerImage)
            updateData.bannerImage = this.storageService.sanitizeUrl(dto.bannerImage);
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
        this.loggerService.log({ action: 'category_updated', categoryId: id }, 'CategoriesService');
        return this.findById(id);
    }
    async move(id, dto, userId) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat || cat.deletedAt)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        if (id === dto.newParentId)
            throw new exceptions_1.BusinessException('Cannot move category to itself', 'CAT_003');
        const newParent = await this.categoriesRepository.findById(dto.newParentId);
        if (!newParent || newParent.deletedAt)
            throw new exceptions_1.BusinessException('Target parent not found', 'CAT_004');
        const oldParentId = cat.parentId;
        const newLevel = newParent.level + 1;
        const levelDiff = newLevel - cat.level;
        const newPath = `${newParent.path}/${cat.id}`.replace(/^\//, '');
        await this.categoriesRepository.update(id, {
            parentId: dto.newParentId,
            level: newLevel,
            path: newPath,
            updatedBy: userId,
        });
        const descendants = await this.categoriesRepository.findDescendants(`${cat.path}/`);
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
        this.loggerService.log({
            action: 'category_moved',
            categoryId: id,
            newParentId: dto.newParentId,
        }, 'CategoriesService');
        return this.findById(id);
    }
    async reorder(dto, userId) {
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
        this.loggerService.log({ action: 'categories_reordered', count: dto.items.length }, 'CategoriesService');
    }
    async delete(id, userId) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat || cat.deletedAt)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        await this.categoriesRepository.unlinkChildren(id, cat.parentId || null, cat.level || 0);
        await this.categoriesRepository.softDelete(id);
        await this.auditService.log({
            action: 'CATEGORY_DELETED',
            module: 'categories',
            resource: 'category',
            resourceId: id,
            userId,
            oldValue: { name: cat.name },
        });
        this.loggerService.log({ action: 'category_deleted', categoryId: id }, 'CategoriesService');
    }
    async restore(id, userId) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat)
            throw new exceptions_1.BusinessException('Category not found', 'CAT_001');
        if (!cat.deletedAt)
            throw new exceptions_1.BusinessException('Category is not deleted', 'CAT_006');
        if (cat.parentId) {
            const parent = await this.categoriesRepository.findById(cat.parentId);
            if (!parent || parent.deletedAt)
                throw new exceptions_1.BusinessException('Parent category is deleted. Restore parent first.', 'CAT_007');
        }
        await this.categoriesRepository.restore(id);
        await this.auditService.log({
            action: 'CATEGORY_RESTORED',
            module: 'categories',
            resource: 'category',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'category_restored', categoryId: id }, 'CategoriesService');
        return this.findById(id);
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [categories_repository_1.CategoriesRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService,
        storage_service_1.StorageService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map