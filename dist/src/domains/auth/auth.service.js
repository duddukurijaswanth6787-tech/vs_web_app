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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const identity_constants_1 = require("../../shared/identity/identity.constants");
const auth_repository_1 = require("./auth.repository");
const password_service_1 = require("./services/password.service");
const jwt_service_1 = require("./services/jwt.service");
const refresh_token_service_1 = require("./services/refresh-token.service");
const google_auth_service_1 = require("./services/google-auth.service");
let AuthService = class AuthService {
    authRepository;
    passwordService;
    jwtService;
    refreshTokenService;
    googleAuthService;
    loggerService;
    constructor(authRepository, passwordService, jwtService, refreshTokenService, googleAuthService, loggerService) {
        this.authRepository = authRepository;
        this.passwordService = passwordService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.googleAuthService = googleAuthService;
        this.loggerService = loggerService;
    }
    async seedAdmin() {
        if (await this.authRepository.hasSuperAdmin()) {
            throw new exceptions_1.BusinessException('Admin already provisioned', 'AUTH_ADMIN_ALREADY_SEEDED');
        }
        return this.authRepository.seedAdmin();
    }
    async register(dto, ip, userAgent) {
        const existing = await this.authRepository.findByEmailBasic(dto.email);
        if (existing) {
            throw new exceptions_1.BusinessException('Email already registered', 'AUTH_003');
        }
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = await this.authRepository.createUser({
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
        });
        const role = await this.authRepository.findRoleByName(identity_constants_1.IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE);
        if (role) {
            await this.authRepository.assignRole(user.id, role.id);
        }
        const payload = {
            sub: user.id,
            email: user.email,
            userType: user.userType,
            roles: [identity_constants_1.IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE],
        };
        const accessToken = await this.jwtService.sign(payload);
        const refreshToken = await this.refreshTokenService.create(user.id, ip, userAgent);
        this.loggerService.log({ action: 'register', userId: user.id }, 'AuthService');
        return {
            accessToken,
            refreshToken,
            expiresIn: await this.jwtService.getExpiresIn(),
        };
    }
    async login(dto, ip, userAgent) {
        const inputIdentifier = (dto.email || dto.username || '').trim();
        if (!inputIdentifier) {
            throw new exceptions_1.AuthenticationException('Email or username is required', 'AUTH_001');
        }
        const user = await this.authRepository.findByEmail(inputIdentifier);
        if (!user) {
            throw new exceptions_1.AuthenticationException('Invalid credentials', 'AUTH_001');
        }
        if (user.accountStatus === 'LOCKED' || user.accountStatus === 'SUSPENDED') {
            throw new exceptions_1.AuthenticationException('Account is locked or suspended', 'AUTH_004');
        }
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            throw new exceptions_1.AuthenticationException('Account is temporarily locked. Try again later.', 'AUTH_005');
        }
        const valid = await this.passwordService.verify(user.passwordHash, dto.password);
        if (!valid) {
            const attempts = user.loginAttempts + 1;
            const maxAttempts = identity_constants_1.IDENTITY_CONSTANTS.MAX_LOGIN_ATTEMPTS;
            let lockoutUntil = null;
            if (attempts >= maxAttempts) {
                lockoutUntil = new Date(Date.now() + identity_constants_1.IDENTITY_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000);
            }
            await this.authRepository.updateLoginAttempts(user.id, attempts, lockoutUntil);
            this.loggerService.warn({ action: 'login_failed', userId: user.id, attempts }, 'AuthService');
            throw new exceptions_1.AuthenticationException('Invalid credentials', 'AUTH_001');
        }
        await this.authRepository.resetLoginAttempts(user.id);
        const roles = user.userRoles.map((ur) => ur.role.name);
        const payload = {
            sub: user.id,
            email: user.email,
            userType: user.userType,
            roles,
        };
        const rememberMe = dto.rememberMe ?? false;
        const accessToken = await this.jwtService.sign(payload, rememberMe);
        const refreshToken = await this.refreshTokenService.create(user.id, ip, userAgent, rememberMe);
        this.loggerService.log({ action: 'login', userId: user.id }, 'AuthService');
        return {
            accessToken,
            refreshToken,
            expiresIn: await this.jwtService.getExpiresIn(rememberMe),
        };
    }
    async issueTokensForUser(userId, ip, userAgent, rememberMe = false) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new exceptions_1.AuthenticationException('User not found', 'AUTH_001');
        }
        if (user.accountStatus === 'LOCKED' || user.accountStatus === 'SUSPENDED') {
            throw new exceptions_1.AuthenticationException('Account is locked or suspended', 'AUTH_004');
        }
        await this.authRepository.resetLoginAttempts(user.id);
        const roles = user.userRoles.map((ur) => ur.role.name);
        const payload = {
            sub: user.id,
            email: user.email,
            userType: user.userType,
            roles,
        };
        const accessToken = await this.jwtService.sign(payload, rememberMe);
        const refreshToken = await this.refreshTokenService.create(user.id, ip, userAgent, rememberMe);
        return {
            accessToken,
            refreshToken,
            expiresIn: await this.jwtService.getExpiresIn(rememberMe),
        };
    }
    async logout(refreshToken) {
        await this.refreshTokenService.revoke(refreshToken);
        this.loggerService.log({ action: 'logout' }, 'AuthService');
    }
    async refresh(refreshToken, ip, userAgent) {
        const record = await this.refreshTokenService.validate(refreshToken);
        if (!record)
            return null;
        const user = await this.authRepository.findById(record.userId);
        if (!user)
            return null;
        await this.refreshTokenService.revoke(refreshToken);
        const roles = user.userRoles.map((ur) => ur.role.name);
        const payload = {
            sub: user.id,
            email: user.email,
            userType: user.userType,
            roles,
        };
        const accessToken = await this.jwtService.sign(payload);
        const newRefreshToken = await this.refreshTokenService.create(user.id, ip, userAgent);
        this.loggerService.log({ action: 'refresh', userId: user.id }, 'AuthService');
        return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: await this.jwtService.getExpiresIn(),
        };
    }
    async me(userId) {
        const user = await this.authRepository.findById(userId);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'AUTH_001');
        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = [
            ...new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
        ];
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName ?? undefined,
            userType: user.userType,
            accountStatus: user.accountStatus,
            roles,
            permissions,
        };
    }
    async changePassword(userId, dto) {
        const user = await this.authRepository.findByIdBasic(userId);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'AUTH_001');
        const valid = await this.passwordService.verify(user.passwordHash, dto.currentPassword);
        if (!valid)
            throw new exceptions_1.AuthenticationException('Current password is incorrect', 'AUTH_001');
        const passwordHash = await this.passwordService.hash(dto.newPassword);
        await this.authRepository.updatePassword(userId, passwordHash);
        await this.refreshTokenService.revokeAllForUser(userId);
        this.loggerService.log({ action: 'change_password', userId }, 'AuthService');
    }
    verifyToken(token) {
        return this.jwtService.verify(token);
    }
    async googleLogin(dto, ip, userAgent) {
        const profile = await this.googleAuthService.verifyIdToken(dto.credential);
        let user = await this.authRepository.findByGoogleId(profile.googleId);
        if (!user) {
            const existingByEmail = await this.authRepository.findByEmailBasic(profile.email);
            if (existingByEmail) {
                await this.authRepository.linkGoogleId(existingByEmail.id, profile.googleId);
                user = await this.authRepository.findById(existingByEmail.id);
            }
            else {
                const randomPass = await this.passwordService.hash(Math.random().toString(36).slice(-10));
                const created = await this.authRepository.createUser({
                    email: profile.email,
                    passwordHash: randomPass,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    googleId: profile.googleId,
                    avatar: profile.avatar,
                    isEmailVerified: profile.emailVerified,
                });
                const role = await this.authRepository.findRoleByName(identity_constants_1.IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE);
                if (role) {
                    await this.authRepository.assignRole(created.id, role.id);
                }
                user = await this.authRepository.findById(created.id);
            }
        }
        if (!user)
            throw new exceptions_1.AuthenticationException('Unable to login', 'GOOGLE_003');
        this.loggerService.log({ action: 'google_login', userId: user.id }, 'AuthService');
        return this.issueTokensForUser(user.id, ip, userAgent, dto.rememberMe ?? false);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository,
        password_service_1.PasswordService,
        jwt_service_1.JwtService,
        refresh_token_service_1.RefreshTokenService,
        google_auth_service_1.GoogleAuthService,
        logger_service_1.LoggerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map