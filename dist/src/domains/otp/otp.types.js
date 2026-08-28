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
exports.SendOtpResponse = exports.FirebasePhoneLoginDto = exports.OtpLoginDto = exports.VerifyOtpDto = exports.SendOtpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SendOtpDto {
    phone;
    purpose;
}
exports.SendOtpDto = SendOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/, {
        message: 'Phone must be a valid 10-digit Indian mobile number',
    }),
    __metadata("design:type", String)
], SendOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['LOGIN', 'VERIFY_PHONE', 'REGISTER'],
        default: 'LOGIN',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['LOGIN', 'VERIFY_PHONE', 'REGISTER']),
    __metadata("design:type", String)
], SendOtpDto.prototype, "purpose", void 0);
class VerifyOtpDto {
    phone;
    code;
    purpose;
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['LOGIN', 'VERIFY_PHONE', 'REGISTER'],
        default: 'LOGIN',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['LOGIN', 'VERIFY_PHONE', 'REGISTER']),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "purpose", void 0);
class OtpLoginDto {
    phone;
    code;
    firstName;
    rememberMe;
}
exports.OtpLoginDto = OtpLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/),
    __metadata("design:type", String)
], OtpLoginDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], OtpLoginDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OtpLoginDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OtpLoginDto.prototype, "rememberMe", void 0);
class FirebasePhoneLoginDto {
    idToken;
    firstName;
    rememberMe;
}
exports.FirebasePhoneLoginDto = FirebasePhoneLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Firebase ID token returned by confirmationResult.confirm(code) after Firebase verified the SMS OTP client-side.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FirebasePhoneLoginDto.prototype, "idToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FirebasePhoneLoginDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FirebasePhoneLoginDto.prototype, "rememberMe", void 0);
class SendOtpResponse {
    phone;
    expiresInSeconds;
    purpose;
    devCode;
}
exports.SendOtpResponse = SendOtpResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SendOtpResponse.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SendOtpResponse.prototype, "expiresInSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SendOtpResponse.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SendOtpResponse.prototype, "devCode", void 0);
//# sourceMappingURL=otp.types.js.map