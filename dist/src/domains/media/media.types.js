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
exports.MediaListResponse = exports.MediaResponse = exports.ReorderMediaDto = exports.MediaQueryDto = exports.UpdateMediaDto = exports.CreateMediaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const PRODUCT_MEDIA_TYPES = [
    'IMAGE',
    'VIDEO',
    'DOCUMENT',
    '360_IMAGE',
    'MAIN',
    'FRONT',
    'BACK',
    'SIDE',
    'FABRIC',
    'MODEL',
    'LIFESTYLE',
];
class CreateMediaDto {
    productId;
    variantId;
    colorGroupId;
    mediaType;
    title;
    altText;
    url;
    thumbnailUrl;
    displayOrder;
    isPrimary;
    color;
}
exports.CreateMediaDto = CreateMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "colorGroupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PRODUCT_MEDIA_TYPES }),
    (0, class_validator_1.IsEnum)(PRODUCT_MEDIA_TYPES),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "mediaType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "altText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMediaDto.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "color", void 0);
class UpdateMediaDto {
    colorGroupId;
    title;
    altText;
    url;
    thumbnailUrl;
    displayOrder;
    isPrimary;
    color;
}
exports.UpdateMediaDto = UpdateMediaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateMediaDto.prototype, "colorGroupId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMediaDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMediaDto.prototype, "altText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], UpdateMediaDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], UpdateMediaDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateMediaDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMediaDto.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMediaDto.prototype, "color", void 0);
class MediaQueryDto {
    productId;
    variantId;
    mediaType;
    page;
    limit;
    sortBy;
    sortOrder;
}
exports.MediaQueryDto = MediaQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MediaQueryDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MediaQueryDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaQueryDto.prototype, "mediaType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MediaQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MediaQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'displayOrder' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'asc' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MediaQueryDto.prototype, "sortOrder", void 0);
class ReorderMediaDto {
    items;
}
exports.ReorderMediaDto = ReorderMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], ReorderMediaDto.prototype, "items", void 0);
class MediaResponse {
    id;
    productId;
    variantId;
    mediaType;
    title;
    altText;
    url;
    thumbnailUrl;
    displayOrder;
    isPrimary;
    status;
    color;
    colorGroupId;
    createdAt;
    updatedAt;
}
exports.MediaResponse = MediaResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "mediaType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "altText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MediaResponse.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MediaResponse.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MediaResponse.prototype, "colorGroupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MediaResponse.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MediaResponse.prototype, "updatedAt", void 0);
class MediaListResponse {
    data;
    meta;
}
exports.MediaListResponse = MediaListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MediaResponse] }),
    __metadata("design:type", Array)
], MediaListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MediaListResponse.prototype, "meta", void 0);
//# sourceMappingURL=media.types.js.map