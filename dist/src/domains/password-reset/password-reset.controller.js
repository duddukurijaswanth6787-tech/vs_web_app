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
exports.PasswordResetController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const password_reset_service_1 = require("./password-reset.service");
const password_reset_types_1 = require("./password-reset.types");
const response_builder_1 = require("../../common/responses/response.builder");
const throttle_decorators_1 = require("../../common/security/throttle.decorators");
let PasswordResetController = class PasswordResetController {
    passwordResetService;
    constructor(passwordResetService) {
        this.passwordResetService = passwordResetService;
    }
    async forgot(dto) {
        const result = await this.passwordResetService.forgot(dto.email);
        return response_builder_1.ResponseBuilder.success(result, result.message);
    }
    async reset(dto, req) {
        const result = await this.passwordResetService.reset(dto.token, dto.newPassword, req.ip, req.headers['user-agent']);
        return response_builder_1.ResponseBuilder.success(result, result.message);
    }
    async validateToken(dto) {
        return response_builder_1.ResponseBuilder.success(await this.passwordResetService.validateToken(dto.token));
    }
};
exports.PasswordResetController = PasswordResetController;
__decorate([
    (0, throttle_decorators_1.ThrottleOtpSend)(),
    (0, common_1.Post)('forgot'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset (generates reset token)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_reset_types_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], PasswordResetController.prototype, "forgot", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('reset'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using reset token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_reset_types_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], PasswordResetController.prototype, "reset", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('validate-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate reset token without consuming it' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_reset_types_1.ValidateTokenDto]),
    __metadata("design:returntype", Promise)
], PasswordResetController.prototype, "validateToken", null);
exports.PasswordResetController = PasswordResetController = __decorate([
    (0, swagger_1.ApiTags)('Password Reset'),
    (0, common_1.Controller)('password'),
    __metadata("design:paramtypes", [password_reset_service_1.PasswordResetService])
], PasswordResetController);
//# sourceMappingURL=password-reset.controller.js.map