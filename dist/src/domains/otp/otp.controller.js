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
exports.OtpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const otp_service_1 = require("./otp.service");
const otp_types_1 = require("./otp.types");
const response_builder_1 = require("../../common/responses/response.builder");
const auth_cookie_util_1 = require("../auth/auth-cookie.util");
const throttle_decorators_1 = require("../../common/security/throttle.decorators");
let OtpController = class OtpController {
    otpService;
    constructor(otpService) {
        this.otpService = otpService;
    }
    async send(dto) {
        return response_builder_1.ResponseBuilder.success(await this.otpService.sendOtp(dto), 'OTP sent');
    }
    async verify(dto) {
        return response_builder_1.ResponseBuilder.success(await this.otpService.verifyOtp(dto), 'OTP verified');
    }
    async login(dto, req, res) {
        const result = await this.otpService.loginWithOtp(dto, req.ip, req.headers['user-agent']);
        (0, auth_cookie_util_1.setRefreshTokenCookie)(res, result.refreshToken);
        return response_builder_1.ResponseBuilder.success((0, auth_cookie_util_1.withoutRefreshToken)(result), 'OTP login successful');
    }
    async firebaseLogin(dto, req, res) {
        const result = await this.otpService.loginWithFirebasePhone(dto, req.ip, req.headers['user-agent']);
        (0, auth_cookie_util_1.setRefreshTokenCookie)(res, result.refreshToken);
        return response_builder_1.ResponseBuilder.success((0, auth_cookie_util_1.withoutRefreshToken)(result), 'OTP login successful');
    }
};
exports.OtpController = OtpController;
__decorate([
    (0, throttle_decorators_1.ThrottleOtpSend)(),
    (0, common_1.Post)('send'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP to phone number' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_types_1.SendOtpDto]),
    __metadata("design:returntype", Promise)
], OtpController.prototype, "send", null);
__decorate([
    (0, throttle_decorators_1.ThrottleOtpVerify)(),
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_types_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], OtpController.prototype, "verify", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login or register with OTP' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_types_1.OtpLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], OtpController.prototype, "login", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('firebase-login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Login or register with a phone number verified via Firebase Phone Auth (client already confirmed the SMS code with Firebase)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_types_1.FirebasePhoneLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], OtpController.prototype, "firebaseLogin", null);
exports.OtpController = OtpController = __decorate([
    (0, swagger_1.ApiTags)('OTP Auth'),
    (0, common_1.Controller)('auth/otp'),
    __metadata("design:paramtypes", [otp_service_1.OtpService])
], OtpController);
//# sourceMappingURL=otp.controller.js.map