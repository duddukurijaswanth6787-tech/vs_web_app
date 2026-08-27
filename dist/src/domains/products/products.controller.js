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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const products_types_1 = require("./products.types");
const color_group_dto_1 = require("./dto/color-group.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const auth_service_1 = require("../auth/auth.service");
const response_builder_1 = require("../../common/responses/response.builder");
const INTERNAL_ROLES = ['super_admin', 'admin', 'staff'];
let ProductsController = class ProductsController {
    productsService;
    authService;
    constructor(productsService, authService) {
        this.productsService = productsService;
        this.authService = authService;
    }
    isInternalRequest(req) {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            return false;
        try {
            const payload = this.authService.verifyToken(header.slice(7));
            return payload.roles?.some((r) => INTERNAL_ROLES.includes(r)) ?? false;
        }
        catch {
            return false;
        }
    }
    async findAll(query, req) {
        const restrictToPublicChannels = !this.isInternalRequest(req);
        return response_builder_1.ResponseBuilder.success(await this.productsService.findAll(query, restrictToPublicChannels));
    }
    async findById(id, req) {
        const restrictToPublicChannels = !this.isInternalRequest(req);
        return response_builder_1.ResponseBuilder.success(await this.productsService.findById(id, restrictToPublicChannels));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.productsService.create(dto, user.sub), 'Product created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.update(id, dto, user.sub), 'Product updated');
    }
    async delete(id, user) {
        await this.productsService.delete(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Product deleted');
    }
    async restore(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.restore(id, user.sub), 'Product restored');
    }
    async publish(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.publish(id, user.sub), 'Product published');
    }
    async unpublish(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.unpublish(id, user.sub), 'Product unpublished');
    }
    async feature(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.feature(id, user.sub), 'Product featured');
    }
    async unfeature(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.unfeature(id, user.sub), 'Product unfeatured');
    }
    async assignCategories(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.assignCategories(id, dto, user.sub), 'Categories assigned');
    }
    async removeCategory(id, categoryId) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.removeCategory(id, categoryId), 'Category removed');
    }
    async assignAttributes(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.assignAttributes(id, dto, user.sub), 'Attributes assigned');
    }
    async removeAttribute(id, attributeId) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.removeAttribute(id, attributeId), 'Attribute removed');
    }
    async assignTags(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.assignTags(id, dto, user.sub), 'Tags assigned');
    }
    async removeTag(id, tag, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.removeTag(id, tag, user.sub), 'Tag removed');
    }
    async assignCollections(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.assignCollections(id, dto, user.sub), 'Collections assigned');
    }
    async removeCollection(id, collection, user) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.removeCollection(id, collection, user.sub), 'Collection removed');
    }
    async assignRelatedProducts(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.assignRelatedProducts(id, dto), 'Related products assigned');
    }
    async removeRelatedProduct(id, relatedProductId) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.removeRelatedProduct(id, relatedProductId), 'Related product removed');
    }
    async createColorGroup(id, dto) {
        return response_builder_1.ResponseBuilder.created(await this.productsService.createColorGroup(id, dto), 'Color group created');
    }
    async getColorGroups(id) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.getColorGroups(id));
    }
    async deleteColorGroup(id, groupId) {
        await this.productsService.deleteColorGroup(id, groupId);
        return response_builder_1.ResponseBuilder.deleted('Color group deleted');
    }
    async syncColorGroups(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.productsService.syncColorGroups(id, dto), 'Color groups synchronized');
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List products with search, pagination, filtering, sorting',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [products_types_1.ProductQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:create'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new product' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [products_types_1.CreateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.UpdateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/unpublish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unpublish a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "unpublish", null);
__decorate([
    (0, common_1.Post)(':id/feature'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Feature a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "feature", null);
__decorate([
    (0, common_1.Post)(':id/unfeature'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unfeature a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "unfeature", null);
__decorate([
    (0, common_1.Post)(':id/categories'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign categories to product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.AssignCategoriesDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "assignCategories", null);
__decorate([
    (0, common_1.Delete)(':id/categories/:categoryId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove category from product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeCategory", null);
__decorate([
    (0, common_1.Post)(':id/attributes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign attributes to product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.AssignAttributesDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "assignAttributes", null);
__decorate([
    (0, common_1.Delete)(':id/attributes/:attributeId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove attribute from product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('attributeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeAttribute", null);
__decorate([
    (0, common_1.Post)(':id/tags'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign tags to product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.AssignTagsDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "assignTags", null);
__decorate([
    (0, common_1.Delete)(':id/tags/:tag'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove tag from product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('tag')),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeTag", null);
__decorate([
    (0, common_1.Post)(':id/collections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign collections to product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.AssignCollectionsDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "assignCollections", null);
__decorate([
    (0, common_1.Delete)(':id/collections/:collection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove collection from product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('collection')),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeCollection", null);
__decorate([
    (0, common_1.Post)(':id/related'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign related products' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.AssignRelatedProductsDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "assignRelatedProducts", null);
__decorate([
    (0, common_1.Delete)(':id/related/:relatedProductId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove related product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('relatedProductId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeRelatedProduct", null);
__decorate([
    (0, common_1.Post)(':id/color-groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update a product color group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, color_group_dto_1.CreateColorGroupDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "createColorGroup", null);
__decorate([
    (0, common_1.Get)(':id/color-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all color groups for a product' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getColorGroups", null);
__decorate([
    (0, common_1.Delete)(':id/color-groups/:groupId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a color group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "deleteColorGroup", null);
__decorate([
    (0, common_1.Post)(':id/color-groups/sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Sync color groups, variants, and media' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, color_group_dto_1.SyncColorGroupsDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "syncColorGroups", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('Products'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        auth_service_1.AuthService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map