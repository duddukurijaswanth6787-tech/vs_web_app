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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const email_verification_service_1 = require("./email-verification.service");
const email_verification_types_1 = require("./email-verification.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const throttle_decorators_1 = require("../../common/security/throttle.decorators");
let EmailVerificationController = class EmailVerificationController {
    emailVerificationService;
    constructor(emailVerificationService) {
        this.emailVerificationService = emailVerificationService;
    }
    async send(user) {
        return response_builder_1.ResponseBuilder.success(await this.emailVerificationService.send(user.sub));
    }
    async verify(dto) {
        return response_builder_1.ResponseBuilder.success(await this.emailVerificationService.verify(dto.token));
    }
    async resend(user) {
        return response_builder_1.ResponseBuilder.success(await this.emailVerificationService.resend(user.sub));
    }
    async validateToken(dto) {
        return response_builder_1.ResponseBuilder.success(await this.emailVerificationService.validateToken(dto.token));
    }
};
exports.EmailVerificationController = EmailVerificationController;
__decorate([
    (0, throttle_decorators_1.ThrottleOtpSend)(),
    (0, common_1.Post)('send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate and return verification token' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailVerificationController.prototype, "send", null);
__decorate([
    (0, throttle_decorators_1.ThrottleOtpVerify)(),
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email using verification token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_types_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], EmailVerificationController.prototype, "verify", null);
__decorate([
    (0, throttle_decorators_1.ThrottleOtpSend)(),
    (0, common_1.Post)('resend'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend verification token' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailVerificationController.prototype, "resend", null);
__decorate([
    (0, throttle_decorators_1.ThrottleOtpVerify)(),
    (0, common_1.Post)('validate-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate verification token without consuming it' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_types_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], EmailVerificationController.prototype, "validateToken", null);
exports.EmailVerificationController = EmailVerificationController = __decorate([
    (0, swagger_1.ApiTags)('Email Verification'),
    (0, common_1.Controller)('email-verification'),
    __metadata("design:paramtypes", [email_verification_service_1.EmailVerificationService])
], EmailVerificationController);
//# sourceMappingURL=email-verification.controller.js.map