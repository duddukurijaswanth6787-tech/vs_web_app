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
exports.StorefrontController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const storefront_service_1 = require("./storefront.service");
const storefront_types_1 = require("./storefront.types");
const jwt_auth_guard_1 = require("../../domains/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../domains/auth/guards/roles.guard");
const theme_service_1 = require("./theme.service");
const theme_types_1 = require("./theme.types");
const response_builder_1 = require("../../common/responses/response.builder");
let StorefrontController = class StorefrontController {
    storefrontService;
    themeService;
    constructor(storefrontService, themeService) {
        this.storefrontService = storefrontService;
        this.themeService = themeService;
    }
    async getTheme() {
        return response_builder_1.ResponseBuilder.success(await this.themeService.getTheme());
    }
    async updateTheme(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.themeService.updateColors(user.sub, dto.colors ?? {}), 'Theme updated');
    }
    async resetTheme(user) {
        return response_builder_1.ResponseBuilder.success(await this.themeService.resetAll(user.sub), 'Theme reset to defaults');
    }
    async getSettings() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getSettings());
    }
    async updateSettings(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.updateSettings(dto, user.sub), 'Settings updated');
    }
    async getHomepage() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getHomepage());
    }
    async updateHomepage(body, user) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.updateHomepage(body.sections, user.sub), 'Homepage sections updated');
    }
    async reorderHomepage(dto) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.reorderHomepage(dto), 'Homepage sections reordered');
    }
    async getHomepageCategories() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getHomepageCategories());
    }
    async addHomepageCategory(dto) {
        return response_builder_1.ResponseBuilder.created(await this.storefrontService.addHomepageCategory(dto), 'Category added to homepage');
    }
    async removeHomepageCategory(id) {
        await this.storefrontService.removeHomepageCategory(id);
        return response_builder_1.ResponseBuilder.deleted('Category removed from homepage');
    }
    async reorderHomepageCategories(dto) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.reorderHomepageCategories(dto), 'Homepage categories reordered');
    }
    async getFeatures() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getFeatures());
    }
    async updateFeature(key, dto) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.updateFeature(key, dto), 'Feature toggle updated');
    }
    async bulkUpdateFeatures(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.bulkUpdateFeatures(dto, user.sub), 'Feature toggles updated');
    }
    async getFooter() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getFooterAdmin());
    }
    async addFooterLink(dto) {
        return response_builder_1.ResponseBuilder.created(await this.storefrontService.addFooterLink(dto), 'Footer link added');
    }
    async updateFooterLink(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.updateFooterLink(id, dto), 'Footer link updated');
    }
    async deleteFooterLink(id) {
        await this.storefrontService.deleteFooterLink(id);
        return response_builder_1.ResponseBuilder.deleted('Footer link deleted');
    }
    async getSocialLinks() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getSocialLinks());
    }
    async updateSocialLink(platform, dto) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.updateSocialLink(platform, dto), 'Social link updated');
    }
    async getNewsletters(query) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getNewsletters(query));
    }
    async exportNewsletters() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.exportNewsletters());
    }
    async removeNewsletter(id) {
        await this.storefrontService.removeNewsletter(id);
        return response_builder_1.ResponseBuilder.deleted('Newsletter subscriber deleted');
    }
    async getFeatureToggles() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.getFeatureToggles());
    }
    async updateFeatureToggle(key, enabled) {
        return response_builder_1.ResponseBuilder.success(await this.storefrontService.updateFeatureToggle(key, enabled), `Feature ${key} updated`);
    }
};
exports.StorefrontController = StorefrontController;
__decorate([
    (0, common_1.Get)('theme'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Per-section storefront colours (super admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getTheme", null);
__decorate([
    (0, common_1.Patch)('theme'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Set per-section storefront colours (super admin)' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, theme_types_1.UpdateStorefrontThemeDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateTheme", null);
__decorate([
    (0, common_1.Post)('theme/reset'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore all colours to defaults (super admin)' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "resetTheme", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get website settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update website settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.UpdateWebsiteSettingDto, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('homepage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homepage sections' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getHomepage", null);
__decorate([
    (0, common_1.Patch)('homepage'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk update homepage sections' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateHomepage", null);
__decorate([
    (0, common_1.Patch)('homepage/order'),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder homepage sections' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.ReorderDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "reorderHomepage", null);
__decorate([
    (0, common_1.Get)('homepage/categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homepage categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getHomepageCategories", null);
__decorate([
    (0, common_1.Post)('homepage/categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Add category to homepage' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.CreateHomepageCategoryDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "addHomepageCategory", null);
__decorate([
    (0, common_1.Delete)('homepage/categories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove category from homepage' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "removeHomepageCategory", null);
__decorate([
    (0, common_1.Patch)('homepage/categories/order'),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder homepage categories' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.ReorderDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "reorderHomepageCategories", null);
__decorate([
    (0, common_1.Get)('features'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feature toggles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getFeatures", null);
__decorate([
    (0, common_1.Patch)('features/:key'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a single feature toggle' }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, storefront_types_1.UpdateFeatureToggleDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateFeature", null);
__decorate([
    (0, common_1.Patch)('features'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk update feature toggles' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.BulkFeatureToggleDto, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "bulkUpdateFeatures", null);
__decorate([
    (0, common_1.Get)('footer'),
    (0, swagger_1.ApiOperation)({ summary: 'Get footer with sections and links' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getFooter", null);
__decorate([
    (0, common_1.Post)('footer/link'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a footer link' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.CreateFooterLinkDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "addFooterLink", null);
__decorate([
    (0, common_1.Patch)('footer/link/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a footer link' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, storefront_types_1.UpdateFooterLinkDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateFooterLink", null);
__decorate([
    (0, common_1.Delete)('footer/link/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a footer link' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "deleteFooterLink", null);
__decorate([
    (0, common_1.Get)('social'),
    (0, swagger_1.ApiOperation)({ summary: 'Get social links' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getSocialLinks", null);
__decorate([
    (0, common_1.Patch)('social/:platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a social link' }),
    __param(0, (0, common_1.Param)('platform')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, storefront_types_1.UpdateSocialLinkDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateSocialLink", null);
__decorate([
    (0, common_1.Get)('newsletter'),
    (0, swagger_1.ApiOperation)({ summary: 'Get newsletter subscribers' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.NewsletterQueryDto]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getNewsletters", null);
__decorate([
    (0, common_1.Get)('newsletter/export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export newsletter emails' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "exportNewsletters", null);
__decorate([
    (0, common_1.Delete)('newsletter/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a newsletter subscriber' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "removeNewsletter", null);
__decorate([
    (0, common_1.Get)('feature-toggles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all system feature toggles (Super Admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getFeatureToggles", null);
__decorate([
    (0, common_1.Patch)('feature-toggles/:key'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle a feature flag ON/OFF (Super Admin)' }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "updateFeatureToggle", null);
exports.StorefrontController = StorefrontController = __decorate([
    (0, swagger_1.ApiTags)('Storefront Management'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/storefront'),
    __metadata("design:paramtypes", [storefront_service_1.StorefrontService,
        theme_service_1.ThemeService])
], StorefrontController);
//# sourceMappingURL=storefront.controller.js.map