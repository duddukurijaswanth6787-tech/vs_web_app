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
exports.UpdateOtpGatewayConfigDto = exports.OtpGatewayConfigResponse = exports.STARTMESSAGING_TEMPLATES = exports.OTP_GATEWAY_PROVIDERS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
exports.OTP_GATEWAY_PROVIDERS = ['mock', 'startmessaging'];
exports.STARTMESSAGING_TEMPLATES = [
    {
        id: '0afbdeb0-785d-4dd0-bd48-365a182df276',
        body: 'Your OTP is {{otp}}. Do not share this code with anyone. Powered by Start Messaging.',
        usesAppName: false,
        usesExpiry: false,
    },
    {
        id: '39beb731-de09-4a1d-bbbf-3cc9a12936f9',
        body: 'Your {{appName}} OTP is {{otp}}. Do not share this code with anyone. Powered by Start Messaging.',
        usesAppName: true,
        usesExpiry: false,
    },
    {
        id: '6990f1b1-6a28-4cb4-a8ed-35a450a6b59d',
        body: 'Your {{appName}} OTP is {{otp}}, valid for {{expiry}} minutes. Do not share this code with anyone. Powered by Start Messaging.',
        usesAppName: true,
        usesExpiry: true,
    },
    {
        id: '3465e087-ff91-4e9a-a33c-e571ec5fae45',
        body: 'Your OTP is {{otp}}, valid for {{expiry}} minutes. Do not share this code with anyone. Powered by Start Messaging.',
        usesAppName: false,
        usesExpiry: true,
    },
];
class OtpGatewayConfigResponse {
    provider;
    appName;
    templateLogin;
    templateRegister;
    templateVerifyPhone;
    templateOrderConfirmed;
    expiryMinutes;
    apiKeyConfigured;
}
exports.OtpGatewayConfigResponse = OtpGatewayConfigResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.OTP_GATEWAY_PROVIDERS }),
    __metadata("design:type", String)
], OtpGatewayConfigResponse.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OtpGatewayConfigResponse.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OtpGatewayConfigResponse.prototype, "templateLogin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OtpGatewayConfigResponse.prototype, "templateRegister", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OtpGatewayConfigResponse.prototype, "templateVerifyPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'StartMessaging template ID for order-confirmed SMS (a non-OTP template you create yourself).',
    }),
    __metadata("design:type", String)
], OtpGatewayConfigResponse.prototype, "templateOrderConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OTP validity window in minutes, also substituted into {{expiry}} in templates.' }),
    __metadata("design:type", Number)
], OtpGatewayConfigResponse.prototype, "expiryMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether STARTMESSAGING_API_KEY is set on the server (never returns the key itself).',
    }),
    __metadata("design:type", Boolean)
], OtpGatewayConfigResponse.prototype, "apiKeyConfigured", void 0);
class UpdateOtpGatewayConfigDto {
    provider;
    appName;
    templateLogin;
    templateRegister;
    templateVerifyPhone;
    templateOrderConfirmed;
    expiryMinutes;
    apiKey;
}
exports.UpdateOtpGatewayConfigDto = UpdateOtpGatewayConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.OTP_GATEWAY_PROVIDERS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.OTP_GATEWAY_PROVIDERS),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "templateLogin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "templateRegister", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "templateVerifyPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'StartMessaging template ID for order-confirmed SMS (a non-OTP template you create yourself).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "templateOrderConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'OTP validity window in minutes (also used as {{expiry}} in templates).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateOtpGatewayConfigDto.prototype, "expiryMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'StartMessaging API key. Write-only -- never returned by GET /config. Omit to leave the current key (DB-stored or env var) unchanged.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOtpGatewayConfigDto.prototype, "apiKey", void 0);
//# sourceMappingURL=otp-gateway.types.js.map