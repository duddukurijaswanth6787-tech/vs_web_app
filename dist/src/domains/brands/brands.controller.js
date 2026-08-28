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
exports.BrandsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const brands_service_1 = require("./brands.service");
const products_service_1 = require("../products/products.service");
const products_types_1 = require("../products/products.types");
const brands_types_1 = require("./brands.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let BrandsController = class BrandsController {
    brandsService;
    productsService;
    constructor(brandsService, productsService) {
        this.brandsService = brandsService;
        this.productsService = productsService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.brandsService.findAll(query));
    }
    async findFeatured() {
        return response_builder_1.ResponseBuilder.success(await this.brandsService.findFeatured());
    }
    async findBySlug(slug) {
        return response_builder_1.ResponseBuilder.success(await this.brandsService.findBySlug(slug));
    }
    async findProductsBySlug(slug, query) {
        const brand = await this.brandsService.findBySlug(slug);
        return response_builder_1.ResponseBuilder.success(await this.productsService.findAll({ ...query, brandId: brand.id }));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.brandsService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.brandsService.create(dto, user.sub), 'Brand created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.brandsService.update(id, dto, user.sub), 'Brand updated');
    }
    async delete(id, user) {
        await this.brandsService.delete(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Brand deleted');
    }
    async restore(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.brandsService.restore(id, user.sub), 'Brand restored');
    }
};
exports.BrandsController = BrandsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List brands with search, pagination, filtering, sorting',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [brands_types_1.BrandQueryDto]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('featured'),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured brands' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "findFeatured", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get brand by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)('slug/:slug/products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products by brand slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, products_types_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "findProductsBySlug", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get brand by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('brands:create'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new brand' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [brands_types_1.CreateBrandDto, Object]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('brands:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a brand' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, brands_types_1.UpdateBrandDto, Object]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a brand' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted brand' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "restore", null);
exports.BrandsController = BrandsController = __decorate([
    (0, swagger_1.ApiTags)('Brands'),
    (0, common_1.Controller)('brands'),
    __metadata("design:paramtypes", [brands_service_1.BrandsService,
        products_service_1.ProductsService])
], BrandsController);
//# sourceMappingURL=brands.controller.js.map