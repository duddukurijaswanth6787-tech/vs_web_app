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
exports.TaxRuleListResponse = exports.TaxCalculationResponse = exports.TaxRuleResponse = exports.TaxBreakdownItem = exports.CalculateTaxDto = exports.UpdateTaxRuleDto = exports.CreateTaxRuleDto = exports.TaxType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var TaxType;
(function (TaxType) {
    TaxType["GST"] = "GST";
    TaxType["CGST"] = "CGST";
    TaxType["SGST"] = "SGST";
    TaxType["IGST"] = "IGST";
})(TaxType || (exports.TaxType = TaxType = {}));
class CreateTaxRuleDto {
    name;
    type;
    rate;
    applicableTo;
    applicableIds;
    isActive;
    priority;
}
exports.CreateTaxRuleDto = CreateTaxRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaxRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TaxType }),
    (0, class_validator_1.IsEnum)(TaxType),
    __metadata("design:type", String)
], CreateTaxRuleDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTaxRuleDto.prototype, "rate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaxRuleDto.prototype, "applicableTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateTaxRuleDto.prototype, "applicableIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTaxRuleDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateTaxRuleDto.prototype, "priority", void 0);
class UpdateTaxRuleDto {
    name;
    type;
    rate;
    applicableTo;
    applicableIds;
    isActive;
    priority;
}
exports.UpdateTaxRuleDto = UpdateTaxRuleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTaxRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: TaxType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaxType),
    __metadata("design:type", String)
], UpdateTaxRuleDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTaxRuleDto.prototype, "rate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTaxRuleDto.prototype, "applicableTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateTaxRuleDto.prototype, "applicableIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTaxRuleDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateTaxRuleDto.prototype, "priority", void 0);
class CalculateTaxDto {
    orderAmount;
    productIds;
    categoryIds;
}
exports.CalculateTaxDto = CalculateTaxDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CalculateTaxDto.prototype, "orderAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CalculateTaxDto.prototype, "productIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CalculateTaxDto.prototype, "categoryIds", void 0);
class TaxBreakdownItem {
    type;
    rate;
    amount;
}
exports.TaxBreakdownItem = TaxBreakdownItem;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TaxBreakdownItem.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TaxBreakdownItem.prototype, "rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TaxBreakdownItem.prototype, "amount", void 0);
class TaxRuleResponse {
    id;
    name;
    type;
    rate;
    applicableTo;
    isActive;
    priority;
    createdAt;
}
exports.TaxRuleResponse = TaxRuleResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TaxRuleResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TaxRuleResponse.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TaxRuleResponse.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TaxRuleResponse.prototype, "rate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TaxRuleResponse.prototype, "applicableTo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TaxRuleResponse.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TaxRuleResponse.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TaxRuleResponse.prototype, "createdAt", void 0);
class TaxCalculationResponse {
    orderAmount;
    taxAmount;
    taxBreakdown;
}
exports.TaxCalculationResponse = TaxCalculationResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TaxCalculationResponse.prototype, "orderAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TaxCalculationResponse.prototype, "taxAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TaxBreakdownItem] }),
    __metadata("design:type", Array)
], TaxCalculationResponse.prototype, "taxBreakdown", void 0);
class TaxRuleListResponse {
    data;
    meta;
}
exports.TaxRuleListResponse = TaxRuleListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TaxRuleResponse] }),
    __metadata("design:type", Array)
], TaxRuleListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TaxRuleListResponse.prototype, "meta", void 0);
//# sourceMappingURL=tax.types.js.map