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
exports.PlaceOrderPaymentResponse = exports.PlaceOrderDto = exports.CheckoutSummaryResponse = exports.CheckoutItemResponse = exports.CheckoutPreviewDto = exports.CHECKOUT_PAYMENT_METHODS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.CHECKOUT_PAYMENT_METHODS = ['COD', 'RAZORPAY'];
class CheckoutPreviewDto {
    addressId;
    shippingMethod;
    couponCode;
}
exports.CheckoutPreviewDto = CheckoutPreviewDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CheckoutPreviewDto.prototype, "addressId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'STANDARD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutPreviewDto.prototype, "shippingMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutPreviewDto.prototype, "couponCode", void 0);
class CheckoutItemResponse {
    productId;
    productName;
    variantId;
    quantity;
    unitPrice;
    totalPrice;
    taxAmount;
}
exports.CheckoutItemResponse = CheckoutItemResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutItemResponse.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutItemResponse.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CheckoutItemResponse.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutItemResponse.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutItemResponse.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutItemResponse.prototype, "totalPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutItemResponse.prototype, "taxAmount", void 0);
class CheckoutSummaryResponse {
    items;
    itemCount;
    subtotal;
    discountTotal;
    taxTotal;
    shippingCharge;
    grandTotal;
    estimatedDelivery;
}
exports.CheckoutSummaryResponse = CheckoutSummaryResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CheckoutItemResponse] }),
    __metadata("design:type", Array)
], CheckoutSummaryResponse.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSummaryResponse.prototype, "itemCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSummaryResponse.prototype, "subtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSummaryResponse.prototype, "discountTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSummaryResponse.prototype, "taxTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSummaryResponse.prototype, "shippingCharge", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSummaryResponse.prototype, "grandTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutSummaryResponse.prototype, "estimatedDelivery", void 0);
class PlaceOrderDto {
    addressId;
    shippingMethod;
    notes;
    deliveryInstructions;
    preferredDeliverySlot;
    terminalId;
    couponCode;
    isGift;
    giftWrapMessage;
    paymentMethod;
}
exports.PlaceOrderDto = PlaceOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "addressId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "shippingMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "deliveryInstructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "preferredDeliverySlot", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "terminalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "couponCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PlaceOrderDto.prototype, "isGift", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "giftWrapMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.CHECKOUT_PAYMENT_METHODS, default: 'COD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.CHECKOUT_PAYMENT_METHODS),
    __metadata("design:type", String)
], PlaceOrderDto.prototype, "paymentMethod", void 0);
class PlaceOrderPaymentResponse {
    paymentId;
    providerOrderId;
    amount;
    currency;
    razorpayKeyId;
}
exports.PlaceOrderPaymentResponse = PlaceOrderPaymentResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlaceOrderPaymentResponse.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlaceOrderPaymentResponse.prototype, "providerOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PlaceOrderPaymentResponse.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlaceOrderPaymentResponse.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlaceOrderPaymentResponse.prototype, "razorpayKeyId", void 0);
//# sourceMappingURL=checkout.types.js.map