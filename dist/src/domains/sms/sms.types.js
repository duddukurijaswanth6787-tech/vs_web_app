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
exports.SendOrderSmsDto = exports.SendSmsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SendSmsDto {
    phone;
    template;
    message;
    userId;
}
exports.SendSmsDto = SendSmsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/),
    __metadata("design:type", String)
], SendSmsDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ORDER_CONFIRMED' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "template", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "userId", void 0);
class SendOrderSmsDto {
    orderId;
    template;
}
exports.SendOrderSmsDto = SendOrderSmsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendOrderSmsDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'OTP'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendOrderSmsDto.prototype, "template", void 0);
//# sourceMappingURL=sms.types.js.map