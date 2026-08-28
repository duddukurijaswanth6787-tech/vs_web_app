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
exports.AiAnalyticsResponse = exports.AnalyticsQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AnalyticsQueryDto {
    startDate;
    endDate;
    feature;
}
exports.AnalyticsQueryDto = AnalyticsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "feature", void 0);
class AiAnalyticsResponse {
    totalConversations;
    totalSearches;
    totalRecommendations;
    popularSearches;
    popularProducts;
    usageByFeature;
}
exports.AiAnalyticsResponse = AiAnalyticsResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AiAnalyticsResponse.prototype, "totalConversations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AiAnalyticsResponse.prototype, "totalSearches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AiAnalyticsResponse.prototype, "totalRecommendations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], AiAnalyticsResponse.prototype, "popularSearches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], AiAnalyticsResponse.prototype, "popularProducts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], AiAnalyticsResponse.prototype, "usageByFeature", void 0);
//# sourceMappingURL=ai-analytics.types.js.map