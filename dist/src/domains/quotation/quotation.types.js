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
exports.ConvertQuotationDto = exports.UpdateQuotationDto = exports.CreateQuotationDto = exports.QuotationItemDto = exports.QuotationStatusType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var QuotationStatusType;
(function (QuotationStatusType) {
    QuotationStatusType["DRAFT"] = "DRAFT";
    QuotationStatusType["SENT"] = "SENT";
    QuotationStatusType["ACCEPTED"] = "ACCEPTED";
    QuotationStatusType["CONVERTED"] = "CONVERTED";
    QuotationStatusType["CANCELLED"] = "CANCELLED";
    QuotationStatusType["EXPIRED"] = "EXPIRED";
})(QuotationStatusType || (exports.QuotationStatusType = QuotationStatusType = {}));
class QuotationItemDto {
    productId;
    variantId;
    productName;
    variantTitle;
    sku;
    quantity;
    unitPrice;
    discountPercent;
    taxPercent;
}
exports.QuotationItemDto = QuotationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotationItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotationItemDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], QuotationItemDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], QuotationItemDto.prototype, "variantTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], QuotationItemDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuotationItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], QuotationItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bulk discount for this line, percent' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QuotationItemDto.prototype, "discountPercent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'GST for this line, percent' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QuotationItemDto.prototype, "taxPercent", void 0);
class CreateQuotationDto {
    customerId;
    customerName;
    customerPhone;
    customerEmail;
    items;
    notes;
    termsText;
    validUntil;
    status;
}
exports.CreateQuotationDto = CreateQuotationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Existing customer, when they have an account',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name the quote is addressed to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [QuotationItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuotationItemDto),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Terms printed on the quote' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "termsText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date the quoted prices stop being honoured',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "validUntil", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: QuotationStatusType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(QuotationStatusType),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "status", void 0);
class UpdateQuotationDto extends CreateQuotationDto {
}
exports.UpdateQuotationDto = UpdateQuotationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [QuotationItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuotationItemDto),
    __metadata("design:type", Array)
], UpdateQuotationDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "customerName", void 0);
class ConvertQuotationDto {
    paymentMethod;
    amountPaid;
    terminalId;
}
exports.ConvertQuotationDto = ConvertQuotationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'How the customer paid at the till' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertQuotationDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConvertQuotationDto.prototype, "amountPaid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Register the sale is billed against' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertQuotationDto.prototype, "terminalId", void 0);
//# sourceMappingURL=quotation.types.js.map