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
exports.LoyaltyStatsResponse = exports.LoyaltyBalanceResponse = exports.LoyaltyHistoryQueryDto = exports.AdminRedeemLoyaltyDto = exports.RedeemLoyaltyDto = exports.EarnLoyaltyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class EarnLoyaltyDto {
    customerId;
    points;
    referenceType;
    referenceId;
    description;
}
exports.EarnLoyaltyDto = EarnLoyaltyDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EarnLoyaltyDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EarnLoyaltyDto.prototype, "points", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EarnLoyaltyDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EarnLoyaltyDto.prototype, "referenceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EarnLoyaltyDto.prototype, "description", void 0);
class RedeemLoyaltyDto {
    points;
    referenceType;
    referenceId;
    description;
}
exports.RedeemLoyaltyDto = RedeemLoyaltyDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RedeemLoyaltyDto.prototype, "points", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedeemLoyaltyDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedeemLoyaltyDto.prototype, "referenceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedeemLoyaltyDto.prototype, "description", void 0);
class AdminRedeemLoyaltyDto extends RedeemLoyaltyDto {
    customerId;
}
exports.AdminRedeemLoyaltyDto = AdminRedeemLoyaltyDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AdminRedeemLoyaltyDto.prototype, "customerId", void 0);
class LoyaltyHistoryQueryDto {
    page;
    limit;
}
exports.LoyaltyHistoryQueryDto = LoyaltyHistoryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LoyaltyHistoryQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], LoyaltyHistoryQueryDto.prototype, "limit", void 0);
class LoyaltyBalanceResponse {
    customerId;
    pointsBalance;
    lifetimeEarned;
    lifetimeRedeemed;
    tier;
    isActive;
}
exports.LoyaltyBalanceResponse = LoyaltyBalanceResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LoyaltyBalanceResponse.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LoyaltyBalanceResponse.prototype, "pointsBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LoyaltyBalanceResponse.prototype, "lifetimeEarned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LoyaltyBalanceResponse.prototype, "lifetimeRedeemed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LoyaltyBalanceResponse.prototype, "tier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], LoyaltyBalanceResponse.prototype, "isActive", void 0);
class LoyaltyStatsResponse {
    totalPointsIssued;
    totalPointsRedeemed;
    activeMembers;
    tierBreakdown;
}
exports.LoyaltyStatsResponse = LoyaltyStatsResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LoyaltyStatsResponse.prototype, "totalPointsIssued", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LoyaltyStatsResponse.prototype, "totalPointsRedeemed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LoyaltyStatsResponse.prototype, "activeMembers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], LoyaltyStatsResponse.prototype, "tierBreakdown", void 0);
//# sourceMappingURL=loyalty.types.js.map