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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attributes_service_1 = require("./attributes.service");
const attributes_types_1 = require("./attributes.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AttributesController = class AttributesController {
    attributesService;
    constructor(attributesService) {
        this.attributesService = attributesService;
    }
    async findAllGroups(query) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findAllGroups(query));
    }
    async findGroupById(id) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findGroupById(id));
    }
    async createGroup(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.attributesService.createGroup(dto, user.sub), 'Attribute group created');
    }
    async updateGroup(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.updateGroup(id, dto, user.sub), 'Attribute group updated');
    }
    async deleteGroup(id, user) {
        await this.attributesService.deleteGroup(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Attribute group deleted');
    }
    async restoreGroup(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.restoreGroup(id, user.sub), 'Attribute group restored');
    }
    async findAllAttributes(query) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findAllAttributes(query));
    }
    async findAttributeById(id) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findAttributeById(id));
    }
    async createAttribute(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.attributesService.createAttribute(dto, user.sub), 'Attribute created');
    }
    async updateAttribute(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.updateAttribute(id, dto, user.sub), 'Attribute updated');
    }
    async deleteAttribute(id, user) {
        await this.attributesService.deleteAttribute(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Attribute deleted');
    }
    async restoreAttribute(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.restoreAttribute(id, user.sub), 'Attribute restored');
    }
    async findAllOptions(query) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findAllOptions(query));
    }
    async findOptionById(id) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findOptionById(id));
    }
    async createOption(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.attributesService.createOption(dto, user.sub), 'Attribute option created');
    }
    async updateOption(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.updateOption(id, dto, user.sub), 'Attribute option updated');
    }
    async deleteOption(id, user) {
        await this.attributesService.deleteOption(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Attribute option deleted');
    }
    async restoreOption(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.restoreOption(id, user.sub), 'Attribute option restored');
    }
    async findAllCategoryMappings(query) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.findAllCategoryMappings(query.categoryId));
    }
    async createCategoryMapping(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.attributesService.createCategoryMapping(dto, user.sub), 'Attribute mapped to category');
    }
    async updateCategoryMapping(categoryId, attributeId, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.attributesService.updateCategoryMapping(categoryId, attributeId, dto, user.sub), 'Category attribute mapping updated');
    }
    async deleteCategoryMapping(categoryId, attributeId, user) {
        await this.attributesService.deleteCategoryMapping(categoryId, attributeId, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Attribute unmapped from category');
    }
};
exports.AttributesController = AttributesController;
__decorate([
    (0, common_1.Get)('attribute-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'List attribute groups' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.AttributeGroupQueryDto]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findAllGroups", null);
__decorate([
    (0, common_1.Get)('attribute-groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attribute group by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findGroupById", null);
__decorate([
    (0, common_1.Post)('attribute-groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an attribute group' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.CreateAttributeGroupDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Patch)('attribute-groups/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an attribute group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attributes_types_1.UpdateAttributeGroupDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)('attribute-groups/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete an attribute group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "deleteGroup", null);
__decorate([
    (0, common_1.Post)('attribute-groups/:id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted attribute group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "restoreGroup", null);
__decorate([
    (0, common_1.Get)('attributes'),
    (0, swagger_1.ApiOperation)({ summary: 'List attributes' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.AttributeQueryDto]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findAllAttributes", null);
__decorate([
    (0, common_1.Get)('attributes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attribute by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findAttributeById", null);
__decorate([
    (0, common_1.Post)('attributes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an attribute' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.CreateAttributeDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "createAttribute", null);
__decorate([
    (0, common_1.Patch)('attributes/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an attribute' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attributes_types_1.UpdateAttributeDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "updateAttribute", null);
__decorate([
    (0, common_1.Delete)('attributes/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete an attribute' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "deleteAttribute", null);
__decorate([
    (0, common_1.Post)('attributes/:id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted attribute' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "restoreAttribute", null);
__decorate([
    (0, common_1.Get)('attribute-options'),
    (0, swagger_1.ApiOperation)({ summary: 'List options for an attribute' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.AttributeOptionQueryDto]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findAllOptions", null);
__decorate([
    (0, common_1.Get)('attribute-options/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get option by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findOptionById", null);
__decorate([
    (0, common_1.Post)('attribute-options'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an attribute option' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.CreateAttributeOptionDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "createOption", null);
__decorate([
    (0, common_1.Patch)('attribute-options/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an attribute option' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attributes_types_1.UpdateAttributeOptionDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "updateOption", null);
__decorate([
    (0, common_1.Delete)('attribute-options/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete an attribute option' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "deleteOption", null);
__decorate([
    (0, common_1.Post)('attribute-options/:id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted attribute option' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "restoreOption", null);
__decorate([
    (0, common_1.Get)('category-attributes'),
    (0, swagger_1.ApiOperation)({ summary: 'List attribute mappings for a category' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.CategoryAttributesQueryDto]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "findAllCategoryMappings", null);
__decorate([
    (0, common_1.Post)('category-attributes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Map an attribute to a category' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attributes_types_1.CreateCategoryAttributeDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "createCategoryMapping", null);
__decorate([
    (0, common_1.Patch)('category-attributes/:categoryId/:attributeId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a category-attribute mapping' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Param)('attributeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, attributes_types_1.UpdateCategoryAttributeDto, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "updateCategoryMapping", null);
__decorate([
    (0, common_1.Delete)('category-attributes/:categoryId/:attributeId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove an attribute from a category' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Param)('attributeId')),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AttributesController.prototype, "deleteCategoryMapping", null);
exports.AttributesController = AttributesController = __decorate([
    (0, swagger_1.ApiTags)('Attributes'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [attributes_service_1.AttributesService])
], AttributesController);
//# sourceMappingURL=attributes.controller.js.map