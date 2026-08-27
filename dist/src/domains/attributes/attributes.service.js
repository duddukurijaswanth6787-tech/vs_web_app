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
exports.AttributesService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const commerce_utils_1 = require("../../shared/commerce/commerce.utils");
const commerce_enums_1 = require("../../shared/commerce/commerce.enums");
const audit_service_1 = require("../audit/audit.service");
const attributes_repository_1 = require("./attributes.repository");
const VALID_TYPES = new Set(Object.values(commerce_enums_1.AttributeType));
let AttributesService = class AttributesService {
    repo;
    auditService;
    loggerService;
    constructor(repo, auditService, loggerService) {
        this.repo = repo;
        this.auditService = auditService;
        this.loggerService = loggerService;
    }
    toGroupResponse(g) {
        return {
            id: g.id,
            name: g.name,
            slug: g.slug,
            description: g.description ?? undefined,
            displayOrder: g.displayOrder,
            status: g.status,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt,
        };
    }
    toAttributeResponse(a) {
        return {
            id: a.id,
            groupId: a.groupId,
            groupName: a.group?.name ?? undefined,
            name: a.name,
            slug: a.slug,
            type: a.type,
            description: a.description ?? undefined,
            displayOrder: a.displayOrder,
            isRequired: a.isRequired,
            isFilterable: a.isFilterable,
            isSearchable: a.isSearchable,
            isComparable: a.isComparable,
            isVariant: a.isVariant,
            usesSwatch: a.usesSwatch ?? false,
            status: a.status,
            options: a.options
                ? a.options.map((o) => this.toOptionResponse(o))
                : undefined,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        };
    }
    toOptionResponse(o) {
        return {
            id: o.id,
            attributeId: o.attributeId,
            value: o.value,
            label: o.label,
            swatchImageUrl: o.swatchImageUrl ?? undefined,
            metadata: o.metadata ?? undefined,
            displayOrder: o.displayOrder,
            status: o.status,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        };
    }
    toCategoryMappingResponse(m) {
        return {
            categoryId: m.categoryId,
            attributeId: m.attributeId,
            displayOrder: m.displayOrder,
            isRequired: m.isRequired,
            isFilterable: m.isFilterable,
            isSearchable: m.isSearchable,
            isComparable: m.isComparable,
            isVariant: m.isVariant,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
        };
    }
    async genSlug(name, finder, excludeId) {
        let slug = commerce_utils_1.SlugGenerator.generate(name);
        let existing = await finder(slug);
        let counter = 1;
        while (existing && existing.id !== excludeId) {
            slug = `${commerce_utils_1.SlugGenerator.generate(name)}-${counter}`;
            existing = await finder(slug);
            counter++;
        }
        return slug;
    }
    assertType(type) {
        if (!VALID_TYPES.has(type))
            throw new exceptions_1.BusinessException(`Invalid attribute type: ${type}`, 'ATTR_001');
    }
    async findAllGroups(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.repo.findAllGroups({
            search: query.search,
            status: query.status,
            page,
            limit,
            sortBy: query.sortBy ?? 'displayOrder',
            sortOrder: query.sortOrder ?? 'asc',
        });
        return {
            data: result.data.map((g) => this.toGroupResponse(g)),
            meta: result.meta,
        };
    }
    async findGroupById(id) {
        const group = await this.repo.findGroupById(id);
        if (!group || group.deletedAt)
            throw new exceptions_1.BusinessException('Attribute group not found', 'ATTR_002');
        return this.toGroupResponse(group);
    }
    async createGroup(dto, userId) {
        const slug = dto.slug
            ? await this.genSlug(dto.slug, (s) => this.repo.findGroupBySlug(s))
            : await this.genSlug(dto.name, (s) => this.repo.findGroupBySlug(s));
        const group = await this.repo.createGroup({
            name: dto.name,
            slug,
            description: dto.description,
            displayOrder: dto.displayOrder ?? 0,
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'ATTRIBUTE_GROUP_CREATED',
            module: 'attributes',
            resource: 'attributeGroup',
            resourceId: group.id,
            userId,
            newValue: { name: dto.name, slug },
        });
        this.loggerService.log({ action: 'attribute_group_created', groupId: group.id, name: dto.name }, 'AttributesService');
        return this.findGroupById(group.id);
    }
    async updateGroup(id, dto, userId) {
        const group = await this.repo.findGroupById(id);
        if (!group || group.deletedAt)
            throw new exceptions_1.BusinessException('Attribute group not found', 'ATTR_002');
        const data = { ...dto, updatedBy: userId };
        if (dto.slug) {
            data.slug = await this.genSlug(dto.slug, (s) => this.repo.findGroupBySlug(s), id);
        }
        else if (dto.name) {
            data.slug = await this.genSlug(dto.name, (s) => this.repo.findGroupBySlug(s), id);
        }
        await this.repo.updateGroup(id, data);
        await this.auditService.log({
            action: 'ATTRIBUTE_GROUP_UPDATED',
            module: 'attributes',
            resource: 'attributeGroup',
            resourceId: id,
            userId,
            oldValue: { name: group.name },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'attribute_group_updated', groupId: id }, 'AttributesService');
        return this.findGroupById(id);
    }
    async deleteGroup(id, userId) {
        const group = await this.repo.findGroupById(id);
        if (!group || group.deletedAt)
            throw new exceptions_1.BusinessException('Attribute group not found', 'ATTR_002');
        await this.repo.softDeleteGroup(id);
        await this.auditService.log({
            action: 'ATTRIBUTE_GROUP_DELETED',
            module: 'attributes',
            resource: 'attributeGroup',
            resourceId: id,
            userId,
            oldValue: { name: group.name },
        });
        this.loggerService.log({ action: 'attribute_group_deleted', groupId: id }, 'AttributesService');
    }
    async restoreGroup(id, userId) {
        const group = await this.repo.findGroupById(id);
        if (!group)
            throw new exceptions_1.BusinessException('Attribute group not found', 'ATTR_002');
        if (!group.deletedAt)
            throw new exceptions_1.BusinessException('Attribute group is not deleted', 'ATTR_003');
        await this.repo.restoreGroup(id);
        await this.auditService.log({
            action: 'ATTRIBUTE_GROUP_RESTORED',
            module: 'attributes',
            resource: 'attributeGroup',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'attribute_group_restored', groupId: id }, 'AttributesService');
        return this.findGroupById(id);
    }
    async findAllAttributes(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.repo.findAllAttributes({
            groupId: query.groupId,
            search: query.search,
            status: query.status,
            type: query.type,
            page,
            limit,
            sortBy: query.sortBy ?? 'displayOrder',
            sortOrder: query.sortOrder ?? 'asc',
        });
        return {
            data: result.data.map((a) => this.toAttributeResponse(a)),
            meta: result.meta,
        };
    }
    async findAttributeById(id) {
        const attr = await this.repo.findAttributeById(id);
        if (!attr || attr.deletedAt)
            throw new exceptions_1.BusinessException('Attribute not found', 'ATTR_004');
        return this.toAttributeResponse(attr);
    }
    async createAttribute(dto, userId) {
        this.assertType(dto.type);
        const group = await this.repo.findGroupById(dto.groupId);
        if (!group || group.deletedAt)
            throw new exceptions_1.BusinessException('Attribute group not found', 'ATTR_002');
        const slug = dto.slug
            ? await this.genSlug(dto.slug, (s) => this.repo.findAttributeBySlug(dto.groupId, s))
            : await this.genSlug(dto.name, (s) => this.repo.findAttributeBySlug(dto.groupId, s));
        const attr = await this.repo.createAttribute({
            name: dto.name,
            slug,
            type: dto.type,
            description: dto.description,
            displayOrder: dto.displayOrder ?? 0,
            isRequired: dto.isRequired ?? false,
            isFilterable: dto.isFilterable ?? false,
            isSearchable: dto.isSearchable ?? false,
            isComparable: dto.isComparable ?? false,
            isVariant: dto.isVariant ?? false,
            createdBy: userId,
            group: { connect: { id: dto.groupId } },
        });
        await this.auditService.log({
            action: 'ATTRIBUTE_CREATED',
            module: 'attributes',
            resource: 'attribute',
            resourceId: attr.id,
            userId,
            newValue: { name: dto.name, type: dto.type },
        });
        this.loggerService.log({ action: 'attribute_created', attributeId: attr.id, name: dto.name }, 'AttributesService');
        return this.findAttributeById(attr.id);
    }
    async updateAttribute(id, dto, userId) {
        const attr = await this.repo.findAttributeById(id);
        if (!attr || attr.deletedAt)
            throw new exceptions_1.BusinessException('Attribute not found', 'ATTR_004');
        if (dto.type)
            this.assertType(dto.type);
        const data = { ...dto, updatedBy: userId };
        if (dto.slug) {
            data.slug = await this.genSlug(dto.slug, (s) => this.repo.findAttributeBySlug(attr.groupId, s), id);
        }
        else if (dto.name) {
            data.slug = await this.genSlug(dto.name, (s) => this.repo.findAttributeBySlug(attr.groupId, s), id);
        }
        await this.repo.updateAttribute(id, data);
        await this.auditService.log({
            action: 'ATTRIBUTE_UPDATED',
            module: 'attributes',
            resource: 'attribute',
            resourceId: id,
            userId,
            oldValue: { name: attr.name },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'attribute_updated', attributeId: id }, 'AttributesService');
        return this.findAttributeById(id);
    }
    async deleteAttribute(id, userId) {
        const attr = await this.repo.findAttributeById(id);
        if (!attr || attr.deletedAt)
            throw new exceptions_1.BusinessException('Attribute not found', 'ATTR_004');
        await this.repo.softDeleteAttribute(id);
        await this.auditService.log({
            action: 'ATTRIBUTE_DELETED',
            module: 'attributes',
            resource: 'attribute',
            resourceId: id,
            userId,
            oldValue: { name: attr.name },
        });
        this.loggerService.log({ action: 'attribute_deleted', attributeId: id }, 'AttributesService');
    }
    async restoreAttribute(id, userId) {
        const attr = await this.repo.findAttributeById(id);
        if (!attr)
            throw new exceptions_1.BusinessException('Attribute not found', 'ATTR_004');
        if (!attr.deletedAt)
            throw new exceptions_1.BusinessException('Attribute is not deleted', 'ATTR_005');
        await this.repo.restoreAttribute(id);
        await this.auditService.log({
            action: 'ATTRIBUTE_RESTORED',
            module: 'attributes',
            resource: 'attribute',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'attribute_restored', attributeId: id }, 'AttributesService');
        return this.findAttributeById(id);
    }
    async findAllOptions(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 100, 500);
        const result = await this.repo.findAllOptions({
            attributeId: query.attributeId,
            page,
            limit,
        });
        return {
            data: result.data.map((o) => this.toOptionResponse(o)),
            meta: result.meta,
        };
    }
    async findOptionById(id) {
        const opt = await this.repo.findOptionById(id);
        if (!opt || opt.deletedAt)
            throw new exceptions_1.BusinessException('Attribute option not found', 'ATTR_006');
        return this.toOptionResponse(opt);
    }
    async createOption(dto, userId) {
        const attr = await this.repo.findAttributeById(dto.attributeId);
        if (!attr || attr.deletedAt)
            throw new exceptions_1.BusinessException('Attribute not found', 'ATTR_004');
        const opt = await this.repo.createOption({
            value: dto.value,
            label: dto.label,
            metadata: dto.metadata,
            displayOrder: dto.displayOrder ?? 0,
            attribute: { connect: { id: dto.attributeId } },
        });
        await this.auditService.log({
            action: 'ATTRIBUTE_OPTION_CREATED',
            module: 'attributes',
            resource: 'attributeOption',
            resourceId: opt.id,
            userId,
            newValue: { value: dto.value, label: dto.label },
        });
        this.loggerService.log({ action: 'attribute_option_created', optionId: opt.id }, 'AttributesService');
        return this.findOptionById(opt.id);
    }
    async updateOption(id, dto, userId) {
        const opt = await this.repo.findOptionById(id);
        if (!opt || opt.deletedAt)
            throw new exceptions_1.BusinessException('Attribute option not found', 'ATTR_006');
        await this.repo.updateOption(id, dto);
        await this.auditService.log({
            action: 'ATTRIBUTE_OPTION_UPDATED',
            module: 'attributes',
            resource: 'attributeOption',
            resourceId: id,
            userId,
            oldValue: { value: opt.value },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'attribute_option_updated', optionId: id }, 'AttributesService');
        return this.findOptionById(id);
    }
    async deleteOption(id, userId) {
        const opt = await this.repo.findOptionById(id);
        if (!opt || opt.deletedAt)
            throw new exceptions_1.BusinessException('Attribute option not found', 'ATTR_006');
        await this.repo.softDeleteOption(id);
        await this.auditService.log({
            action: 'ATTRIBUTE_OPTION_DELETED',
            module: 'attributes',
            resource: 'attributeOption',
            resourceId: id,
            userId,
            oldValue: { value: opt.value },
        });
        this.loggerService.log({ action: 'attribute_option_deleted', optionId: id }, 'AttributesService');
    }
    async restoreOption(id, userId) {
        const opt = await this.repo.findOptionById(id);
        if (!opt)
            throw new exceptions_1.BusinessException('Attribute option not found', 'ATTR_006');
        if (!opt.deletedAt)
            throw new exceptions_1.BusinessException('Attribute option is not deleted', 'ATTR_007');
        await this.repo.restoreOption(id);
        await this.auditService.log({
            action: 'ATTRIBUTE_OPTION_RESTORED',
            module: 'attributes',
            resource: 'attributeOption',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'attribute_option_restored', optionId: id }, 'AttributesService');
        return this.findOptionById(id);
    }
    async findAllCategoryMappings(categoryId) {
        const result = await this.repo.findAllCategoryMappings(categoryId);
        return {
            data: result.data.map((m) => this.toCategoryMappingResponse(m)),
        };
    }
    async createCategoryMapping(dto, userId) {
        const existing = await this.repo.findCategoryMapping(dto.categoryId, dto.attributeId);
        if (existing)
            throw new exceptions_1.BusinessException('Attribute already mapped to this category', 'ATTR_008');
        const attr = await this.repo.findAttributeById(dto.attributeId);
        if (!attr || attr.deletedAt)
            throw new exceptions_1.BusinessException('Attribute not found', 'ATTR_004');
        const mapping = await this.repo.createCategoryMapping({
            displayOrder: dto.displayOrder ?? 0,
            isRequired: dto.isRequired ?? false,
            isFilterable: dto.isFilterable ?? false,
            isSearchable: dto.isSearchable ?? false,
            isComparable: dto.isComparable ?? false,
            isVariant: dto.isVariant ?? false,
            category: { connect: { id: dto.categoryId } },
            attribute: { connect: { id: dto.attributeId } },
        });
        await this.auditService.log({
            action: 'ATTRIBUTE_MAPPED_TO_CATEGORY',
            module: 'attributes',
            resource: 'categoryAttribute',
            userId,
            newValue: { categoryId: dto.categoryId, attributeId: dto.attributeId },
        });
        this.loggerService.log({
            action: 'attribute_mapped_to_category',
            categoryId: dto.categoryId,
            attributeId: dto.attributeId,
        }, 'AttributesService');
        return this.toCategoryMappingResponse(mapping);
    }
    async updateCategoryMapping(categoryId, attributeId, dto, userId) {
        const existing = await this.repo.findCategoryMapping(categoryId, attributeId);
        if (!existing)
            throw new exceptions_1.BusinessException('Category attribute mapping not found', 'ATTR_009');
        const mapping = await this.repo.updateCategoryMapping(categoryId, attributeId, { ...dto });
        await this.auditService.log({
            action: 'ATTRIBUTE_MAPPING_UPDATED',
            module: 'attributes',
            resource: 'categoryAttribute',
            userId,
            oldValue: { categoryId, attributeId },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'attribute_mapping_updated', categoryId, attributeId }, 'AttributesService');
        return this.toCategoryMappingResponse(mapping);
    }
    async deleteCategoryMapping(categoryId, attributeId, userId) {
        const existing = await this.repo.findCategoryMapping(categoryId, attributeId);
        if (!existing)
            throw new exceptions_1.BusinessException('Category attribute mapping not found', 'ATTR_009');
        await this.repo.deleteCategoryMapping(categoryId, attributeId);
        await this.auditService.log({
            action: 'ATTRIBUTE_UNMAPPED_FROM_CATEGORY',
            module: 'attributes',
            resource: 'categoryAttribute',
            userId,
            oldValue: { categoryId, attributeId },
        });
        this.loggerService.log({ action: 'attribute_unmapped_from_category', categoryId, attributeId }, 'AttributesService');
    }
};
exports.AttributesService = AttributesService;
exports.AttributesService = AttributesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attributes_repository_1.AttributesRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService])
], AttributesService);
//# sourceMappingURL=attributes.service.js.map