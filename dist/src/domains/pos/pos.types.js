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
exports.PreviewReceiptDto = exports.PosCashMovementDto = exports.ClosePosShiftDto = exports.OpenPosShiftDto = exports.GenerateBatchStickersDto = exports.GenerateBarcodeImageDto = exports.CheckoutSessionResponse = exports.BarcodeScanResultResponse = exports.CompletePosSaleDto = exports.PosSplitTenderDto = exports.CreatePosReturnDto = exports.PosReturnItemDto = exports.PosRefundMethodType = exports.DEFAULT_TERMINAL_ID = exports.AdoptHandoffTokenDto = exports.CreateCheckoutSessionDto = exports.ScanBarcodeDto = exports.PosCustomerInfoDto = exports.PosCartItemDto = exports.PosPaymentMethodType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var PosPaymentMethodType;
(function (PosPaymentMethodType) {
    PosPaymentMethodType["CASH"] = "CASH";
    PosPaymentMethodType["UPI"] = "UPI";
    PosPaymentMethodType["CARD"] = "CARD";
    PosPaymentMethodType["CREDIT"] = "CREDIT";
    PosPaymentMethodType["SPLIT"] = "SPLIT";
})(PosPaymentMethodType || (exports.PosPaymentMethodType = PosPaymentMethodType = {}));
class PosCartItemDto {
    productId;
    variantId;
    productName;
    sku;
    variantTitle;
    quantity;
    unitPrice;
    discountAmount;
    taxAmount;
}
exports.PosCartItemDto = PosCartItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCartItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCartItemDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCartItemDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCartItemDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCartItemDto.prototype, "variantTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PosCartItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PosCartItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PosCartItemDto.prototype, "discountAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PosCartItemDto.prototype, "taxAmount", void 0);
class PosCustomerInfoDto {
    fullName;
    phone;
    email;
}
exports.PosCustomerInfoDto = PosCustomerInfoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCustomerInfoDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCustomerInfoDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosCustomerInfoDto.prototype, "email", void 0);
class ScanBarcodeDto {
    barcode;
    shopId;
}
exports.ScanBarcodeDto = ScanBarcodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Variant Barcode or SKU code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScanBarcodeDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScanBarcodeDto.prototype, "shopId", void 0);
class CreateCheckoutSessionDto {
    items;
    customer;
    shopId;
    deviceId;
    notes;
    discountTotal;
    taxTotal;
    hold;
}
exports.CreateCheckoutSessionDto = CreateCheckoutSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosCartItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosCartItemDto),
    __metadata("design:type", Array)
], CreateCheckoutSessionDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: PosCustomerInfoDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PosCustomerInfoDto),
    __metadata("design:type", PosCustomerInfoDto)
], CreateCheckoutSessionDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "shopId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCheckoutSessionDto.prototype, "discountTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCheckoutSessionDto.prototype, "taxTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Park this cart at the till instead of handing it to a phone. Held ' +
            'carts are listed for the counter to pick back up and last the shift ' +
            'rather than the 30 minutes a handoff gets.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCheckoutSessionDto.prototype, "hold", void 0);
class AdoptHandoffTokenDto {
    handoffToken;
}
exports.AdoptHandoffTokenDto = AdoptHandoffTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '6-digit handoff PIN or token string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdoptHandoffTokenDto.prototype, "handoffToken", void 0);
exports.DEFAULT_TERMINAL_ID = 'COUNTER_1';
var PosRefundMethodType;
(function (PosRefundMethodType) {
    PosRefundMethodType["CASH"] = "CASH";
    PosRefundMethodType["UPI"] = "UPI";
    PosRefundMethodType["CARD"] = "CARD";
    PosRefundMethodType["ORIGINAL"] = "ORIGINAL";
})(PosRefundMethodType || (exports.PosRefundMethodType = PosRefundMethodType = {}));
class PosReturnItemDto {
    orderItemId;
    quantity;
}
exports.PosReturnItemDto = PosReturnItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OrderItem being returned' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosReturnItemDto.prototype, "orderItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PosReturnItemDto.prototype, "quantity", void 0);
class CreatePosReturnDto {
    orderNumber;
    items;
    refundMethod;
    reason;
    terminalId;
    notes;
}
exports.CreatePosReturnDto = CreatePosReturnDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Order number from the customer receipt' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePosReturnDto.prototype, "orderNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosReturnItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosReturnItemDto),
    __metadata("design:type", Array)
], CreatePosReturnDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PosRefundMethodType }),
    (0, class_validator_1.IsEnum)(PosRefundMethodType),
    __metadata("design:type", String)
], CreatePosReturnDto.prototype, "refundMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePosReturnDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Register the refund is paid out from. Decides which drawer the cash comes out of at close.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePosReturnDto.prototype, "terminalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePosReturnDto.prototype, "notes", void 0);
class PosSplitTenderDto {
    method;
    amount;
}
exports.PosSplitTenderDto = PosSplitTenderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: PosPaymentMethodType,
        description: 'How this part of the bill was paid.',
    }),
    (0, class_validator_1.IsEnum)(PosPaymentMethodType),
    __metadata("design:type", String)
], PosSplitTenderDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount handed over on this tender.' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PosSplitTenderDto.prototype, "amount", void 0);
class CompletePosSaleDto {
    sessionId;
    items;
    paymentMethod;
    amountPaid;
    splitPayments;
    customer;
    terminalId;
    shopId;
    notes;
    discountTotal;
    taxTotal;
    clientOrderNumber;
    isOfflineSync;
}
exports.CompletePosSaleDto = CompletePosSaleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Checkout Session ID if initiated via Mobile Handoff',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompletePosSaleDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PosCartItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosCartItemDto),
    __metadata("design:type", Array)
], CompletePosSaleDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: PosPaymentMethodType,
        default: PosPaymentMethodType.UPI,
    }),
    (0, class_validator_1.IsEnum)(PosPaymentMethodType),
    __metadata("design:type", String)
], CompletePosSaleDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompletePosSaleDto.prototype, "amountPaid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [PosSplitTenderDto],
        description: 'Tenders when paymentMethod is SPLIT. Each is recorded as its own ' +
            'payment so the drawer count and card settlement both reconcile.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosSplitTenderDto),
    __metadata("design:type", Array)
], CompletePosSaleDto.prototype, "splitPayments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: PosCustomerInfoDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PosCustomerInfoDto),
    __metadata("design:type", PosCustomerInfoDto)
], CompletePosSaleDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompletePosSaleDto.prototype, "terminalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompletePosSaleDto.prototype, "shopId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompletePosSaleDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletePosSaleDto.prototype, "discountTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletePosSaleDto.prototype, "taxTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client-generated order number for offline-queued sales. Used as an idempotency key: replaying the same clientOrderNumber (e.g. a retried sync after a dropped connection) returns the already-created order instead of creating a duplicate.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompletePosSaleDto.prototype, "clientOrderNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'True when this sale is being synced from the offline queue rather than submitted live. Triggers a stock-sufficiency check before the order is created, since stock may have moved while the terminal was offline.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CompletePosSaleDto.prototype, "isOfflineSync", void 0);
class BarcodeScanResultResponse {
    productId;
    productName;
    variantId;
    sku;
    barcode;
    variantTitle;
    price;
    costPrice;
    availableStock;
    primaryImage;
    taxPercent;
    mrp;
    hsnCode;
}
exports.BarcodeScanResultResponse = BarcodeScanResultResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "variantTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BarcodeScanResultResponse.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], BarcodeScanResultResponse.prototype, "costPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BarcodeScanResultResponse.prototype, "availableStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "primaryImage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], BarcodeScanResultResponse.prototype, "taxPercent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], BarcodeScanResultResponse.prototype, "mrp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BarcodeScanResultResponse.prototype, "hsnCode", void 0);
class CheckoutSessionResponse {
    id;
    sessionId;
    handoffToken;
    status;
    subtotal;
    discountTotal;
    taxTotal;
    grandTotal;
    items;
    customer;
    expiresAt;
    createdAt;
}
exports.CheckoutSessionResponse = CheckoutSessionResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutSessionResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutSessionResponse.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutSessionResponse.prototype, "handoffToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutSessionResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSessionResponse.prototype, "subtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSessionResponse.prototype, "discountTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSessionResponse.prototype, "taxTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CheckoutSessionResponse.prototype, "grandTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CheckoutSessionResponse.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", PosCustomerInfoDto)
], CheckoutSessionResponse.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CheckoutSessionResponse.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CheckoutSessionResponse.prototype, "createdAt", void 0);
class GenerateBarcodeImageDto {
    code;
    bcid;
    scale;
    height;
}
exports.GenerateBarcodeImageDto = GenerateBarcodeImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Text or number to encode' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBarcodeImageDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'code128' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBarcodeImageDto.prototype, "bcid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 2 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateBarcodeImageDto.prototype, "scale", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateBarcodeImageDto.prototype, "height", void 0);
class GenerateBatchStickersDto {
    productName;
    variantTitle;
    sku;
    barcode;
    price;
    quantity;
    storeName;
    labelSize;
}
exports.GenerateBatchStickersDto = GenerateBatchStickersDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBatchStickersDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBatchStickersDto.prototype, "variantTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBatchStickersDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBatchStickersDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateBatchStickersDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerateBatchStickersDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'Vasanthi Designers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBatchStickersDto.prototype, "storeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['SMALL', 'MEDIUM', 'LARGE'],
        default: 'SMALL',
        description: 'SMALL 50x25mm (barcode only), MEDIUM 75x40mm (adds a QR code), LARGE 100x50mm (full branded design with QR)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['SMALL', 'MEDIUM', 'LARGE']),
    __metadata("design:type", String)
], GenerateBatchStickersDto.prototype, "labelSize", void 0);
class OpenPosShiftDto {
    terminalId;
    openingCash;
    notes;
}
exports.OpenPosShiftDto = OpenPosShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenPosShiftDto.prototype, "terminalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Starting cash float counted into the drawer' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], OpenPosShiftDto.prototype, "openingCash", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenPosShiftDto.prototype, "notes", void 0);
class ClosePosShiftDto {
    closingCashCounted;
    notes;
}
exports.ClosePosShiftDto = ClosePosShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Physical cash counted in the drawer at close' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ClosePosShiftDto.prototype, "closingCashCounted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClosePosShiftDto.prototype, "notes", void 0);
class PosCashMovementDto {
    direction;
    amount;
    reason;
}
exports.PosCashMovementDto = PosCashMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['IN', 'OUT'],
        description: 'IN when notes are added to the drawer, OUT when they are taken out.',
    }),
    (0, class_validator_1.IsIn)(['IN', 'OUT']),
    __metadata("design:type", String)
], PosCashMovementDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount moved. Always positive.' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], PosCashMovementDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Why the money moved -- "paid delivery boy", "banked surplus". ' +
            'Required: an unexplained drawer movement is indistinguishable from theft.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PosCashMovementDto.prototype, "reason", void 0);
class PreviewReceiptDto {
    orderNumber;
    grandTotal;
    items;
    customer;
    paymentMethod;
    discountTotal;
    taxTotal;
    cashierName;
    transactionId;
}
exports.PreviewReceiptDto = PreviewReceiptDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewReceiptDto.prototype, "orderNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PreviewReceiptDto.prototype, "grandTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosCartItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PosCartItemDto),
    __metadata("design:type", Array)
], PreviewReceiptDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: PosCustomerInfoDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PosCustomerInfoDto),
    __metadata("design:type", PosCustomerInfoDto)
], PreviewReceiptDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewReceiptDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PreviewReceiptDto.prototype, "discountTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PreviewReceiptDto.prototype, "taxTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewReceiptDto.prototype, "cashierName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Payment gateway transaction/reference ID, if this sale went through one (e.g. UPI/card). Omitted for cash sales.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewReceiptDto.prototype, "transactionId", void 0);
//# sourceMappingURL=pos.types.js.map