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
exports.VerifyPaymentDto = exports.PaymentListResponse = exports.PaymentResponse = exports.PaymentTransactionResponse = exports.PaymentQueryDto = exports.UpdateRazorpayConfigDto = exports.RazorpayConfigResponse = exports.CreatePaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreatePaymentDto {
    orderId;
    method;
    provider;
    amount;
    currency;
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'INR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "currency", void 0);
class RazorpayConfigResponse {
    keyId;
    keySecretConfigured;
    webhookSecretConfigured;
}
exports.RazorpayConfigResponse = RazorpayConfigResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Not a secret -- safe to display and to embed in frontend JS.' }),
    __metadata("design:type", String)
], RazorpayConfigResponse.prototype, "keyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a Key Secret is set on the server (the value itself is never returned).' }),
    __metadata("design:type", Boolean)
], RazorpayConfigResponse.prototype, "keySecretConfigured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a Webhook Secret is set on the server (the value itself is never returned).' }),
    __metadata("design:type", Boolean)
], RazorpayConfigResponse.prototype, "webhookSecretConfigured", void 0);
class UpdateRazorpayConfigDto {
    keyId;
    keySecret;
    webhookSecret;
}
exports.UpdateRazorpayConfigDto = UpdateRazorpayConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRazorpayConfigDto.prototype, "keyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Write-only -- never returned by GET. Omit to leave the current secret (DB-stored or env var) unchanged.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRazorpayConfigDto.prototype, "keySecret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Write-only -- never returned by GET. Omit to leave the current secret (DB-stored or env var) unchanged.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRazorpayConfigDto.prototype, "webhookSecret", void 0);
class PaymentQueryDto {
    orderId;
    status;
    page;
    limit;
}
exports.PaymentQueryDto = PaymentQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PaymentQueryDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PaymentQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PaymentQueryDto.prototype, "limit", void 0);
class PaymentTransactionResponse {
    id;
    type;
    status;
    amount;
    providerRefId;
    createdAt;
}
exports.PaymentTransactionResponse = PaymentTransactionResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentTransactionResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentTransactionResponse.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentTransactionResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaymentTransactionResponse.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PaymentTransactionResponse.prototype, "providerRefId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PaymentTransactionResponse.prototype, "createdAt", void 0);
class PaymentResponse {
    id;
    orderId;
    paymentNumber;
    method;
    provider;
    status;
    amount;
    currency;
    providerOrderId;
    transactionId;
    transactions;
    createdAt;
}
exports.PaymentResponse = PaymentResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "paymentNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaymentResponse.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "providerOrderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PaymentResponse.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PaymentTransactionResponse] }),
    __metadata("design:type", Array)
], PaymentResponse.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PaymentResponse.prototype, "createdAt", void 0);
class PaymentListResponse {
    data;
    meta;
}
exports.PaymentListResponse = PaymentListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PaymentResponse] }),
    __metadata("design:type", Array)
], PaymentListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], PaymentListResponse.prototype, "meta", void 0);
class VerifyPaymentDto {
    razorpayPaymentId;
    razorpaySignature;
}
exports.VerifyPaymentDto = VerifyPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
//# sourceMappingURL=payment.types.js.map