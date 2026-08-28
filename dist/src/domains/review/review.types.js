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
exports.ReportReviewDto = exports.ReportReason = exports.ProductReviewQueryDto = exports.CustomerUpdateReviewDto = exports.CustomerCreateReviewDto = exports.ProductRatingSummary = exports.ReviewListResponse = exports.ReviewResponse = exports.ReviewImageResponse = exports.ReviewQueryDto = exports.UpdateReviewDto = exports.CreateReviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateReviewDto {
    productId;
    rating;
    title;
    comment;
    images;
}
exports.CreateReviewDto = CreateReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1, maximum: 5 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], CreateReviewDto.prototype, "images", void 0);
class UpdateReviewDto {
    rating;
    title;
    comment;
}
exports.UpdateReviewDto = UpdateReviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReviewDto.prototype, "comment", void 0);
class ReviewQueryDto {
    productId;
    customerId;
    rating;
    status;
    page;
    limit;
}
exports.ReviewQueryDto = ReviewQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReviewQueryDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReviewQueryDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ReviewQueryDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ReviewQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ReviewQueryDto.prototype, "limit", void 0);
class ReviewImageResponse {
    id;
    url;
    altText;
    displayOrder;
}
exports.ReviewImageResponse = ReviewImageResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReviewImageResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReviewImageResponse.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ReviewImageResponse.prototype, "altText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ReviewImageResponse.prototype, "displayOrder", void 0);
class ReviewResponse {
    id;
    productId;
    customerId;
    rating;
    title;
    comment;
    isVerifiedPurchase;
    isApproved;
    helpfulCount;
    unhelpfulCount;
    status;
    images;
    createdAt;
}
exports.ReviewResponse = ReviewResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReviewResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReviewResponse.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReviewResponse.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ReviewResponse.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ReviewResponse.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ReviewResponse.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ReviewResponse.prototype, "isVerifiedPurchase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ReviewResponse.prototype, "isApproved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ReviewResponse.prototype, "helpfulCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ReviewResponse.prototype, "unhelpfulCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReviewResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ReviewImageResponse] }),
    __metadata("design:type", Array)
], ReviewResponse.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ReviewResponse.prototype, "createdAt", void 0);
class ReviewListResponse {
    data;
    meta;
}
exports.ReviewListResponse = ReviewListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ReviewResponse] }),
    __metadata("design:type", Array)
], ReviewListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ReviewListResponse.prototype, "meta", void 0);
class ProductRatingSummary {
    averageRating;
    totalReviews;
    ratingDistribution;
}
exports.ProductRatingSummary = ProductRatingSummary;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProductRatingSummary.prototype, "averageRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProductRatingSummary.prototype, "totalReviews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProductRatingSummary.prototype, "ratingDistribution", void 0);
class CustomerCreateReviewDto {
    rating;
    title;
    comment;
    images;
}
exports.CustomerCreateReviewDto = CustomerCreateReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1, maximum: 5 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CustomerCreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minLength: 5, maxLength: 120 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CustomerCreateReviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minLength: 10, maxLength: 5000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CustomerCreateReviewDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], maxItems: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], CustomerCreateReviewDto.prototype, "images", void 0);
class CustomerUpdateReviewDto {
    rating;
    title;
    comment;
    images;
}
exports.CustomerUpdateReviewDto = CustomerUpdateReviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CustomerUpdateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minLength: 5, maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CustomerUpdateReviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minLength: 10, maxLength: 5000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CustomerUpdateReviewDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], maxItems: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], CustomerUpdateReviewDto.prototype, "images", void 0);
class ProductReviewQueryDto {
    page;
    limit;
    sort;
    rating;
    verifiedPurchase;
    imagesOnly;
}
exports.ProductReviewQueryDto = ProductReviewQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProductReviewQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ProductReviewQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['newest', 'oldest', 'highest', 'lowest', 'helpful'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductReviewQueryDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ProductReviewQueryDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ProductReviewQueryDto.prototype, "verifiedPurchase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ProductReviewQueryDto.prototype, "imagesOnly", void 0);
var ReportReason;
(function (ReportReason) {
    ReportReason["SPAM"] = "Spam";
    ReportReason["ABUSE"] = "Abuse";
    ReportReason["FAKE"] = "Fake Review";
    ReportReason["OFFENSIVE"] = "Offensive";
    ReportReason["OTHER"] = "Other";
})(ReportReason || (exports.ReportReason = ReportReason = {}));
class ReportReviewDto {
    reason;
}
exports.ReportReviewDto = ReportReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReportReason }),
    (0, class_validator_1.IsEnum)(ReportReason),
    __metadata("design:type", String)
], ReportReviewDto.prototype, "reason", void 0);
//# sourceMappingURL=review.types.js.map