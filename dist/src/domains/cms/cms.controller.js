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
exports.CmsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cms_service_1 = require("./cms.service");
const cms_types_1 = require("./cms.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let CmsController = class CmsController {
    cmsService;
    constructor(cmsService) {
        this.cmsService = cmsService;
    }
    async findBanners(query) {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.findBanners(query));
    }
    async findBannerById(id) {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.findBannerById(id));
    }
    async createBanner(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.cmsService.createBanner(dto, user.sub), 'Banner created');
    }
    async updateBanner(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.updateBanner(id, dto, user.sub), 'Banner updated');
    }
    async deleteBanner(id, user) {
        await this.cmsService.deleteBanner(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Banner deleted');
    }
    async findPages(query) {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.findPages(query));
    }
    async findPageBySlug(slug) {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.findPageBySlug(slug));
    }
    async createPage(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.cmsService.createPage(dto, user.sub), 'Page created');
    }
    async updatePage(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.updatePage(id, dto, user.sub), 'Page updated');
    }
    async findSections() {
        return response_builder_1.ResponseBuilder.success(await this.cmsService.findSections());
    }
    async createSection(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.cmsService.createSection(dto, user.sub), 'Section created');
    }
};
exports.CmsController = CmsController;
__decorate([
    (0, common_1.Get)('banners'),
    (0, swagger_1.ApiOperation)({ summary: 'List banners' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_types_1.BannerQueryDto]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "findBanners", null);
__decorate([
    (0, common_1.Get)('banners/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get banner by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "findBannerById", null);
__decorate([
    (0, common_1.Post)('banners'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new banner' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_types_1.CreateBannerDto, Object]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "createBanner", null);
__decorate([
    (0, common_1.Patch)('banners/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a banner' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cms_types_1.UpdateBannerDto, Object]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "updateBanner", null);
__decorate([
    (0, common_1.Delete)('banners/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a banner' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "deleteBanner", null);
__decorate([
    (0, common_1.Get)('pages'),
    (0, swagger_1.ApiOperation)({ summary: 'List CMS pages' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_types_1.CmsPageQueryDto]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "findPages", null);
__decorate([
    (0, common_1.Get)('pages/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get page by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "findPageBySlug", null);
__decorate([
    (0, common_1.Post)('pages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new CMS page' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_types_1.CreateCmsPageDto, Object]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "createPage", null);
__decorate([
    (0, common_1.Patch)('pages/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a CMS page' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cms_types_1.UpdateCmsPageDto, Object]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "updatePage", null);
__decorate([
    (0, common_1.Get)('sections'),
    (0, swagger_1.ApiOperation)({ summary: 'List CMS sections' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "findSections", null);
__decorate([
    (0, common_1.Post)('sections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new CMS section' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_types_1.CreateCmsSectionDto, Object]),
    __metadata("design:returntype", Promise)
], CmsController.prototype, "createSection", null);
exports.CmsController = CmsController = __decorate([
    (0, swagger_1.ApiTags)('CMS'),
    (0, common_1.Controller)('cms'),
    __metadata("design:paramtypes", [cms_service_1.CmsService])
], CmsController);
//# sourceMappingURL=cms.controller.js.map