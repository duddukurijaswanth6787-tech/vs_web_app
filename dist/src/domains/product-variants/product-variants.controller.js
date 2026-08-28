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
exports.ProductVariantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const product_variants_service_1 = require("./product-variants.service");
const product_variants_types_1 = require("./product-variants.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let ProductVariantsController = class ProductVariantsController {
    variantsService;
    constructor(variantsService) {
        this.variantsService = variantsService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.findAll(query));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.variantsService.create(dto, user.sub), 'Variant created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.update(id, dto, user.sub), 'Variant updated');
    }
    async delete(id, user) {
        await this.variantsService.delete(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Variant deleted');
    }
    async restore(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.restore(id, user.sub), 'Variant restored');
    }
    async activate(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.activate(id, user.sub), 'Variant activated');
    }
    async deactivate(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.deactivate(id, user.sub), 'Variant deactivated');
    }
    async setDefault(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.setDefault(id, user.sub), 'Default variant set');
    }
    async assignAttributeValues(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.assignAttributeValues(id, dto, user.sub), 'Attribute values assigned');
    }
    async removeAttributeValue(id, attributeId) {
        return response_builder_1.ResponseBuilder.success(await this.variantsService.removeAttributeValue(id, attributeId), 'Attribute value removed');
    }
};
exports.ProductVariantsController = ProductVariantsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List variants with filtering, pagination, sorting',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_variants_types_1.VariantQueryDto]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get variant by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:create'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new variant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_variants_types_1.CreateVariantDto, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_variants_types_1.UpdateVariantDto, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/set-default'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Set variant as default for its product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "setDefault", null);
__decorate([
    (0, common_1.Post)(':id/attribute-values'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign attribute values to variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_variants_types_1.AssignAttributeValuesDto, Object]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "assignAttributeValues", null);
__decorate([
    (0, common_1.Delete)(':id/attribute-values/:attributeId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove attribute value from variant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('attributeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductVariantsController.prototype, "removeAttributeValue", null);
exports.ProductVariantsController = ProductVariantsController = __decorate([
    (0, swagger_1.ApiTags)('Product Variants'),
    (0, common_1.Controller)('variants'),
    __metadata("design:paramtypes", [product_variants_service_1.ProductVariantsService])
], ProductVariantsController);
//# sourceMappingURL=product-variants.controller.js.map