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
exports.OrderListResponse = exports.OrderResponse = exports.OrderTimelineResponse = exports.OrderAddressResponse = exports.OrderItemResponse = exports.OrderQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class OrderQueryDto {
    search;
    status;
    customerId;
    startDate;
    endDate;
    page;
    limit;
    sortBy;
    sortOrder;
}
exports.OrderQueryDto = OrderQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], OrderQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], OrderQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "sortOrder", void 0);
class OrderItemResponse {
    id;
    productId;
    productName;
    variantId;
    variantTitle;
    sku;
    quantity;
    unitPrice;
    totalPrice;
    taxAmount;
    discountAmount;
}
exports.OrderItemResponse = OrderItemResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderItemResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderItemResponse.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderItemResponse.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderItemResponse.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderItemResponse.prototype, "variantTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderItemResponse.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItemResponse.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItemResponse.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItemResponse.prototype, "totalPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItemResponse.prototype, "taxAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderItemResponse.prototype, "discountAmount", void 0);
class OrderAddressResponse {
    id;
    addressType;
    fullName;
    phone;
    addressLine1;
    addressLine2;
    city;
    state;
    country;
    postalCode;
    landmark;
}
exports.OrderAddressResponse = OrderAddressResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "addressType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "addressLine1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "addressLine2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderAddressResponse.prototype, "landmark", void 0);
class OrderTimelineResponse {
    id;
    status;
    message;
    createdBy;
    createdAt;
}
exports.OrderTimelineResponse = OrderTimelineResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderTimelineResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderTimelineResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderTimelineResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderTimelineResponse.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], OrderTimelineResponse.prototype, "createdAt", void 0);
class OrderResponse {
    id;
    orderNumber;
    customerId;
    status;
    subtotal;
    discountTotal;
    taxTotal;
    shippingCharge;
    grandTotal;
    currency;
    notes;
    channel;
    paymentMethod;
    terminalId;
    items;
    addresses;
    timeline;
    createdAt;
    updatedAt;
}
exports.OrderResponse = OrderResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponse.prototype, "orderNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponse.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderResponse.prototype, "subtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderResponse.prototype, "discountTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderResponse.prototype, "taxTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderResponse.prototype, "shippingCharge", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderResponse.prototype, "grandTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponse.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OrderResponse.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Admin-only: sales channel. Omitted from customer-facing responses.',
    }),
    __metadata("design:type", String)
], OrderResponse.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Admin-only: POS payment method. Omitted from customer-facing responses.',
    }),
    __metadata("design:type", String)
], OrderResponse.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Admin-only: POS terminal ID. Omitted from customer-facing responses.',
    }),
    __metadata("design:type", String)
], OrderResponse.prototype, "terminalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [OrderItemResponse] }),
    __metadata("design:type", Array)
], OrderResponse.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [OrderAddressResponse] }),
    __metadata("design:type", Array)
], OrderResponse.prototype, "addresses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [OrderTimelineResponse] }),
    __metadata("design:type", Array)
], OrderResponse.prototype, "timeline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], OrderResponse.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], OrderResponse.prototype, "updatedAt", void 0);
class OrderListResponse {
    data;
    meta;
}
exports.OrderListResponse = OrderListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OrderResponse] }),
    __metadata("design:type", Array)
], OrderListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], OrderListResponse.prototype, "meta", void 0);
//# sourceMappingURL=order.types.js.map