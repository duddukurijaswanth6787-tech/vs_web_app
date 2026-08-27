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
exports.StorefrontPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const storefront_public_service_1 = require("./storefront-public.service");
const theme_service_1 = require("./theme.service");
const products_service_1 = require("../../domains/products/products.service");
const storefront_types_1 = require("./storefront.types");
const response_builder_1 = require("../../common/responses/response.builder");
const jwt_auth_guard_1 = require("../../domains/auth/guards/jwt-auth.guard");
let StorefrontPublicController = class StorefrontPublicController {
    storefrontPublicService;
    productsService;
    themeService;
    constructor(storefrontPublicService, productsService, themeService) {
        this.storefrontPublicService = storefrontPublicService;
        this.productsService = productsService;
        this.themeService = themeService;
    }
    async getTheme() {
        return response_builder_1.ResponseBuilder.success(await this.themeService.getTheme());
    }
    async getPublicSettings() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontPublicService.getPublicSettings());
    }
    async getHomepage() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontPublicService.getHomepage());
    }
    async getFooter() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontPublicService.getFooter());
    }
    async getSocialLinks() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontPublicService.getSocialLinks());
    }
    async getFeatures() {
        return response_builder_1.ResponseBuilder.success(await this.storefrontPublicService.getFeatures());
    }
    async subscribe(dto) {
        return response_builder_1.ResponseBuilder.created(await this.storefrontPublicService.subscribeToNewsletter(dto), 'Successfully subscribed to newsletter');
    }
    async getProductBySlug(slug) {
        const product = await this.productsService.findBySlug(slug, true);
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return response_builder_1.ResponseBuilder.success(product);
    }
};
exports.StorefrontPublicController = StorefrontPublicController;
__decorate([
    (0, common_1.Get)('storefront/theme'),
    (0, jwt_auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Per-section storefront colours' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getTheme", null);
__decorate([
    (0, common_1.Get)(['settings/public', 'public/settings']),
    (0, jwt_auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get public store settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getPublicSettings", null);
__decorate([
    (0, common_1.Get)('homepage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homepage configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getHomepage", null);
__decorate([
    (0, common_1.Get)('footer'),
    (0, swagger_1.ApiOperation)({ summary: 'Get footer sections and links' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getFooter", null);
__decorate([
    (0, common_1.Get)('social'),
    (0, swagger_1.ApiOperation)({ summary: 'Get social links' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getSocialLinks", null);
__decorate([
    (0, common_1.Get)('features'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feature toggles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getFeatures", null);
__decorate([
    (0, common_1.Post)('newsletter/subscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to newsletter' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storefront_types_1.NewsletterSubscribeDto]),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Get)('products/slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontPublicController.prototype, "getProductBySlug", null);
exports.StorefrontPublicController = StorefrontPublicController = __decorate([
    (0, swagger_1.ApiTags)('Storefront Public'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [storefront_public_service_1.StorefrontPublicService,
        products_service_1.ProductsService,
        theme_service_1.ThemeService])
], StorefrontPublicController);
//# sourceMappingURL=storefront-public.controller.js.map