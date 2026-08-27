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
exports.GlobalSearchResponse = exports.GlobalSearchDto = exports.SearchListResponse = exports.AutocompleteResponse = exports.SearchResponse = exports.AutocompleteDto = exports.SearchProductsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class SearchProductsDto {
    q;
    brandId;
    categoryId;
    gender;
    ageGroup;
    occasion;
    season;
    type;
    isFeatured;
    isNewArrival;
    isBestSeller;
    inStock;
    minPrice;
    maxPrice;
    tags;
    collections;
    attributeFilters;
    sortBy;
    sortOrder;
    page;
    limit;
}
exports.SearchProductsDto = SearchProductsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "ageGroup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "occasion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "season", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], SearchProductsDto.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], SearchProductsDto.prototype, "isNewArrival", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], SearchProductsDto.prototype, "isBestSeller", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], SearchProductsDto.prototype, "inStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SearchProductsDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SearchProductsDto.prototype, "collections", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SearchProductsDto.prototype, "attributeFilters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'relevance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "limit", void 0);
class AutocompleteDto {
    q;
    limit;
}
exports.AutocompleteDto = AutocompleteDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AutocompleteDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], AutocompleteDto.prototype, "limit", void 0);
class FilterOption {
    value;
    label;
    count;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FilterOption.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FilterOption.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FilterOption.prototype, "count", void 0);
class AvailableFilters {
    brands;
    categories;
    genders;
    ageGroups;
    occasions;
    seasons;
    types;
    tags;
    collections;
    priceRange;
    attributes;
}
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "genders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "ageGroups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "occasions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "seasons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "types", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FilterOption] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "collections", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AvailableFilters.prototype, "priceRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], AvailableFilters.prototype, "attributes", void 0);
class SearchResultProduct {
    id;
    name;
    slug;
    sku;
    shortDescription;
    brandId;
    brandName;
    basePrice;
    salePrice;
    status;
    isFeatured;
    isNewArrival;
    isBestSeller;
    gender;
    ageGroup;
    tags;
    collections;
    primaryImage;
    createdAt;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "shortDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchResultProduct.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SearchResultProduct.prototype, "salePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchResultProduct.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchResultProduct.prototype, "isNewArrival", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchResultProduct.prototype, "isBestSeller", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "ageGroup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    __metadata("design:type", Array)
], SearchResultProduct.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    __metadata("design:type", Array)
], SearchResultProduct.prototype, "collections", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchResultProduct.prototype, "primaryImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SearchResultProduct.prototype, "createdAt", void 0);
class SearchResponse {
    data;
    appliedFilters;
    availableFilters;
    meta;
}
exports.SearchResponse = SearchResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SearchResultProduct] }),
    __metadata("design:type", Array)
], SearchResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SearchResponse.prototype, "appliedFilters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", AvailableFilters)
], SearchResponse.prototype, "availableFilters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SearchResponse.prototype, "meta", void 0);
class AutocompleteResponse {
    products;
    suggestions;
}
exports.AutocompleteResponse = AutocompleteResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], AutocompleteResponse.prototype, "products", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], AutocompleteResponse.prototype, "suggestions", void 0);
class SearchListResponse {
    data;
    meta;
}
exports.SearchListResponse = SearchListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SearchResultProduct] }),
    __metadata("design:type", Array)
], SearchListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SearchListResponse.prototype, "meta", void 0);
class GlobalSearchDto {
    q;
    limit;
}
exports.GlobalSearchDto = GlobalSearchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GlobalSearchDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], GlobalSearchDto.prototype, "limit", void 0);
class GlobalSearchResponse {
    products;
    orders;
    customers;
    categories;
    brands;
    coupons;
}
exports.GlobalSearchResponse = GlobalSearchResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], GlobalSearchResponse.prototype, "products", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], GlobalSearchResponse.prototype, "orders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], GlobalSearchResponse.prototype, "customers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], GlobalSearchResponse.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], GlobalSearchResponse.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], GlobalSearchResponse.prototype, "coupons", void 0);
//# sourceMappingURL=search.types.js.map