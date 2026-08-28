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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const google_auth_service_1 = require("./services/google-auth.service");
const auth_types_1 = require("./auth.types");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const throttle_decorators_1 = require("../../common/security/throttle.decorators");
const auth_cookie_util_1 = require("./auth-cookie.util");
let AuthController = class AuthController {
    authService;
    googleAuthService;
    constructor(authService, googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }
    async seedAdmin() {
        const result = await this.authService.seedAdmin();
        return response_builder_1.ResponseBuilder.success(result, 'Admin user seeded successfully');
    }
    async register(dto, req, res) {
        const result = await this.authService.register(dto, req.ip, req.headers['user-agent']);
        (0, auth_cookie_util_1.setRefreshTokenCookie)(res, result.refreshToken);
        return response_builder_1.ResponseBuilder.created((0, auth_cookie_util_1.withoutRefreshToken)(result), 'Registration successful');
    }
    async login(dto, req, res) {
        const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);
        (0, auth_cookie_util_1.setRefreshTokenCookie)(res, result.refreshToken);
        return response_builder_1.ResponseBuilder.success((0, auth_cookie_util_1.withoutRefreshToken)(result), 'Login successful');
    }
    async googleClientId() {
        const clientId = await this.googleAuthService.getEffectiveClientId();
        return response_builder_1.ResponseBuilder.success({ clientId });
    }
    async googleAuth(dto, req, res) {
        const result = await this.authService.googleLogin(dto, req.ip, req.headers['user-agent']);
        (0, auth_cookie_util_1.setRefreshTokenCookie)(res, result.refreshToken);
        return response_builder_1.ResponseBuilder.success((0, auth_cookie_util_1.withoutRefreshToken)(result), 'Google login successful');
    }
    async logout(dto, req, res) {
        const token = dto.refreshToken || req.cookies?.[auth_cookie_util_1.REFRESH_TOKEN_COOKIE];
        if (token)
            await this.authService.logout(token);
        (0, auth_cookie_util_1.clearRefreshTokenCookie)(res);
        return response_builder_1.ResponseBuilder.success(null, 'Logout successful');
    }
    async refresh(dto, req, res) {
        const token = req.cookies?.[auth_cookie_util_1.REFRESH_TOKEN_COOKIE] || dto.refreshToken;
        const result = token
            ? await this.authService.refresh(token, req.ip, req.headers['user-agent'])
            : null;
        if (!result) {
            (0, auth_cookie_util_1.clearRefreshTokenCookie)(res);
            return response_builder_1.ResponseBuilder.success(null, 'Invalid or expired refresh token');
        }
        (0, auth_cookie_util_1.setRefreshTokenCookie)(res, result.refreshToken);
        return response_builder_1.ResponseBuilder.success((0, auth_cookie_util_1.withoutRefreshToken)(result), 'Token refreshed');
    }
    async me(user) {
        const result = await this.authService.me(user.sub);
        return response_builder_1.ResponseBuilder.success(result, 'User profile retrieved');
    }
    async changePassword(user, dto) {
        await this.authService.changePassword(user.sub, dto);
        return response_builder_1.ResponseBuilder.success(null, 'Password changed successfully');
    }
    async verifyToken(body) {
        try {
            this.authService.verifyToken(body.token);
            return response_builder_1.ResponseBuilder.success({ valid: true }, 'Token is valid');
        }
        catch {
            return response_builder_1.ResponseBuilder.success({ valid: false }, 'Token is invalid');
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('seed-admin'),
    (0, common_1.Get)('seed-admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Seed or reset initial admin credentials' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "seedAdmin", null);
__decorate([
    (0, throttle_decorators_1.ThrottleSignup)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user account' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_types_1.RegisterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Authenticate user and return tokens' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_types_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('google/client-id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the Google OAuth Client ID (public, no secret) for the frontend Sign-In button',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleClientId", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('google'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Authenticate or register customer with Google Sign-In',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_types_1.GoogleLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke refresh token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_types_1.RefreshDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token using refresh token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_types_1.RefreshDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user profile' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Change current user password' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_types_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, throttle_decorators_1.ThrottleCredentials)(),
    (0, common_1.Post)('verify-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify JWT token validity' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyToken", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        google_auth_service_1.GoogleAuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map