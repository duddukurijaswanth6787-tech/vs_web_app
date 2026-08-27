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
exports.RecommendationHistoryQueryDto = exports.RecommendationResponse = exports.RecommendationQueryDto = exports.RecommendationType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["RECENTLY_VIEWED"] = "RECENTLY_VIEWED";
    RecommendationType["FREQUENTLY_PURCHASED"] = "FREQUENTLY_PURCHASED";
    RecommendationType["RECOMMENDED"] = "RECOMMENDED";
    RecommendationType["RECENTLY_PURCHASED"] = "RECENTLY_PURCHASED";
    RecommendationType["WISHLIST_BASED"] = "WISHLIST_BASED";
    RecommendationType["CART_BASED"] = "CART_BASED";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
class RecommendationQueryDto {
    type;
    page;
    limit;
}
exports.RecommendationQueryDto = RecommendationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: RecommendationType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RecommendationType),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecommendationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], RecommendationQueryDto.prototype, "limit", void 0);
class RecommendationResponse {
    id;
    productId;
    score;
    reason;
    type;
    createdAt;
}
exports.RecommendationResponse = RecommendationResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RecommendationResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RecommendationResponse.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], RecommendationResponse.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], RecommendationResponse.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: RecommendationType }),
    __metadata("design:type", String)
], RecommendationResponse.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], RecommendationResponse.prototype, "createdAt", void 0);
class RecommendationHistoryQueryDto {
    page;
    limit;
}
exports.RecommendationHistoryQueryDto = RecommendationHistoryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecommendationHistoryQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], RecommendationHistoryQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=ai-recommendation.types.js.map