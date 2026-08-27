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
exports.ReturnQueryDto = exports.ReturnRequestResponse = exports.ReturnItemResponse = exports.ReturnItemImageResponse = exports.UpdateReturnStatusDto = exports.CreateReturnDto = exports.ReturnItemDto = exports.RefundPreference = exports.ReturnStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ReturnStatus;
(function (ReturnStatus) {
    ReturnStatus["REQUESTED"] = "REQUESTED";
    ReturnStatus["APPROVED"] = "APPROVED";
    ReturnStatus["REJECTED"] = "REJECTED";
    ReturnStatus["PICKUP_SCHEDULED"] = "PICKUP_SCHEDULED";
    ReturnStatus["PICKED_UP"] = "PICKED_UP";
    ReturnStatus["WAREHOUSE_RECEIVED"] = "WAREHOUSE_RECEIVED";
    ReturnStatus["INSPECTION"] = "INSPECTION";
    ReturnStatus["REFUND_INITIATED"] = "REFUND_INITIATED";
    ReturnStatus["REFUND_COMPLETED"] = "REFUND_COMPLETED";
    ReturnStatus["CANCELLED"] = "CANCELLED";
})(ReturnStatus || (exports.ReturnStatus = ReturnStatus = {}));
var RefundPreference;
(function (RefundPreference) {
    RefundPreference["ORIGINAL_PAYMENT"] = "ORIGINAL_PAYMENT";
    RefundPreference["WALLET"] = "WALLET";
    RefundPreference["BANK_TRANSFER"] = "BANK_TRANSFER";
    RefundPreference["STORE_CREDIT"] = "STORE_CREDIT";
})(RefundPreference || (exports.RefundPreference = RefundPreference = {}));
class ReturnItemDto {
    orderItemId;
    quantity;
    reason;
}
exports.ReturnItemDto = ReturnItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReturnItemDto.prototype, "orderItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ReturnItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnItemDto.prototype, "reason", void 0);
class CreateReturnDto {
    orderId;
    reason;
    refundPreference;
    items;
}
exports.CreateReturnDto = CreateReturnDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: RefundPreference }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RefundPreference),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "refundPreference", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ReturnItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReturnItemDto),
    __metadata("design:type", Array)
], CreateReturnDto.prototype, "items", void 0);
class UpdateReturnStatusDto {
    status;
    adminNotes;
}
exports.UpdateReturnStatusDto = UpdateReturnStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReturnStatus }),
    (0, class_validator_1.IsEnum)(ReturnStatus),
    __metadata("design:type", String)
], UpdateReturnStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReturnStatusDto.prototype, "adminNotes", void 0);
class ReturnItemImageResponse {
    id;
    url;
    displayOrder;
}
exports.ReturnItemImageResponse = ReturnItemImageResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnItemImageResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnItemImageResponse.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ReturnItemImageResponse.prototype, "displayOrder", void 0);
class ReturnItemResponse {
    id;
    orderItemId;
    quantity;
    reason;
    images;
}
exports.ReturnItemResponse = ReturnItemResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnItemResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnItemResponse.prototype, "orderItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ReturnItemResponse.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ReturnItemResponse.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ReturnItemImageResponse] }),
    __metadata("design:type", Array)
], ReturnItemResponse.prototype, "images", void 0);
class ReturnRequestResponse {
    id;
    orderId;
    returnNumber;
    reason;
    status;
    refundPreference;
    adminNotes;
    items;
    createdAt;
}
exports.ReturnRequestResponse = ReturnRequestResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "returnNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "refundPreference", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ReturnRequestResponse.prototype, "adminNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ReturnItemResponse] }),
    __metadata("design:type", Array)
], ReturnRequestResponse.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ReturnRequestResponse.prototype, "createdAt", void 0);
class ReturnQueryDto {
    status;
    orderId;
    page;
    limit;
}
exports.ReturnQueryDto = ReturnQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReturnQueryDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ReturnQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ReturnQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=return-request.types.js.map