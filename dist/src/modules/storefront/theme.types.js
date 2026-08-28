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
exports.StorefrontThemeResponse = exports.UpdateStorefrontThemeDto = exports.THEME_SECTIONS = exports.THEME_TOKENS = exports.HEX_COLOR = void 0;
exports.isHexColor = isHexColor;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function isHexColor(value) {
    return typeof value === 'string' && exports.HEX_COLOR.test(value.trim());
}
exports.THEME_TOKENS = {
    'brand-primary': '#0284c7',
    'brand-primary-dark': '#0B3B78',
    'brand-on-primary': '#ffffff',
    'page-bg': '#FDFBFB',
    'announcement-bg': '#0284c7',
    'announcement-text': '#ffffff',
    'header-bg': '#ffffff',
    'header-text': '#171717',
    'header-border': '#e5e5e5',
    'hero-bg': '#EAF4FF',
    'hero-text': '#171717',
    'category-bg': '#ffffff',
    'category-text': '#171717',
    'product-card-bg': '#ffffff',
    'product-card-text': '#171717',
    'product-price': '#0284c7',
    'benefits-bg': '#EAF4FF',
    'benefits-text': '#171717',
    'testimonials-bg': '#ffffff',
    'testimonials-text': '#171717',
    'newsletter-bg': '#0A2138',
    'newsletter-text': '#ffffff',
    'footer-bg': '#0A2138',
    'footer-text': '#DCEBFA',
    'footer-heading': '#ffffff',
    'footer-link-hover': '#ffffff',
};
exports.THEME_SECTIONS = [
    {
        key: 'brand',
        label: 'Brand & Buttons',
        tokens: [
            { token: 'brand-primary', label: 'Primary colour' },
            { token: 'brand-primary-dark', label: 'Primary hover' },
            { token: 'brand-on-primary', label: 'Text on primary' },
            { token: 'page-bg', label: 'Page background' },
        ],
    },
    {
        key: 'announcement',
        label: 'Announcement Bar',
        tokens: [
            { token: 'announcement-bg', label: 'Background' },
            { token: 'announcement-text', label: 'Text' },
        ],
    },
    {
        key: 'header',
        label: 'Header',
        tokens: [
            { token: 'header-bg', label: 'Background' },
            { token: 'header-text', label: 'Text & icons' },
            { token: 'header-border', label: 'Bottom border' },
        ],
    },
    {
        key: 'hero',
        label: 'Hero Banner',
        tokens: [
            { token: 'hero-bg', label: 'Background' },
            { token: 'hero-text', label: 'Text' },
        ],
    },
    {
        key: 'category',
        label: 'Category Circles',
        tokens: [
            { token: 'category-bg', label: 'Background' },
            { token: 'category-text', label: 'Text' },
        ],
    },
    {
        key: 'product',
        label: 'Product Cards',
        tokens: [
            { token: 'product-card-bg', label: 'Card background' },
            { token: 'product-card-text', label: 'Card text' },
            { token: 'product-price', label: 'Price' },
        ],
    },
    {
        key: 'benefits',
        label: 'Benefits Strip',
        tokens: [
            { token: 'benefits-bg', label: 'Background' },
            { token: 'benefits-text', label: 'Text' },
        ],
    },
    {
        key: 'testimonials',
        label: 'Testimonials',
        tokens: [
            { token: 'testimonials-bg', label: 'Background' },
            { token: 'testimonials-text', label: 'Text' },
        ],
    },
    {
        key: 'newsletter',
        label: 'Newsletter',
        tokens: [
            { token: 'newsletter-bg', label: 'Background' },
            { token: 'newsletter-text', label: 'Text' },
        ],
    },
    {
        key: 'footer',
        label: 'Footer',
        tokens: [
            { token: 'footer-bg', label: 'Background' },
            { token: 'footer-text', label: 'Text' },
            { token: 'footer-heading', label: 'Headings' },
            { token: 'footer-link-hover', label: 'Link hover' },
        ],
    },
];
class UpdateStorefrontThemeDto {
    colors;
}
exports.UpdateStorefrontThemeDto = UpdateStorefrontThemeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Map of theme token to hex colour. Unknown tokens and non-hex values are rejected.',
        example: { 'brand-primary': '#0284c7', 'footer-bg': '#0A2138' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateStorefrontThemeDto.prototype, "colors", void 0);
class StorefrontThemeResponse {
    colors;
    defaults;
    sections;
}
exports.StorefrontThemeResponse = StorefrontThemeResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], StorefrontThemeResponse.prototype, "colors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], StorefrontThemeResponse.prototype, "defaults", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], StorefrontThemeResponse.prototype, "sections", void 0);
//# sourceMappingURL=theme.types.js.map