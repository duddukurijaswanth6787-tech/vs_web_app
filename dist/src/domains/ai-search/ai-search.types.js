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
exports.SearchHistoryQueryDto = exports.SearchStatsResponse = exports.TrendingSearchResponse = exports.SearchHistoryResponse = exports.SearchSuggestionResponse = exports.AiSearchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AiSearchDto {
    query;
    filters;
    limit;
}
exports.AiSearchDto = AiSearchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AiSearchDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AiSearchDto.prototype, "limit", void 0);
class SearchSuggestionResponse {
    products;
    categories;
    brands;
}
exports.SearchSuggestionResponse = SearchSuggestionResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], SearchSuggestionResponse.prototype, "products", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], SearchSuggestionResponse.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], SearchSuggestionResponse.prototype, "brands", void 0);
class SearchHistoryResponse {
    id;
    query;
    resultCount;
    clickedProductIds;
    createdAt;
}
exports.SearchHistoryResponse = SearchHistoryResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchHistoryResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchHistoryResponse.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchHistoryResponse.prototype, "resultCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], SearchHistoryResponse.prototype, "clickedProductIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SearchHistoryResponse.prototype, "createdAt", void 0);
class TrendingSearchResponse {
    query;
    count;
}
exports.TrendingSearchResponse = TrendingSearchResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrendingSearchResponse.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TrendingSearchResponse.prototype, "count", void 0);
class SearchStatsResponse {
    totalSearches;
    zeroResultCount;
    zeroResultRate;
    clickThroughRate;
    topQuery;
}
exports.SearchStatsResponse = SearchStatsResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchStatsResponse.prototype, "totalSearches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchStatsResponse.prototype, "zeroResultCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchStatsResponse.prototype, "zeroResultRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchStatsResponse.prototype, "clickThroughRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", TrendingSearchResponse)
], SearchStatsResponse.prototype, "topQuery", void 0);
class SearchHistoryQueryDto {
    page;
    limit;
}
exports.SearchHistoryQueryDto = SearchHistoryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchHistoryQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SearchHistoryQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=ai-search.types.js.map