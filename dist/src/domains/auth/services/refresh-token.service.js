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
exports.RefreshTokenService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../../../database/prisma.service");
const session_settings_service_1 = require("./session-settings.service");
function hashToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
let RefreshTokenService = class RefreshTokenService {
    prisma;
    sessionSettingsService;
    constructor(prisma, sessionSettingsService) {
        this.prisma = prisma;
        this.sessionSettingsService = sessionSettingsService;
    }
    async create(userId, ipAddress, userAgent, rememberMe = false) {
        const settings = await this.sessionSettingsService.getSettings();
        const expiryDays = rememberMe ? settings.rememberMeRefreshTokenDays : settings.refreshTokenDays;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);
        const token = (0, node_crypto_1.randomUUID)();
        await this.prisma.refreshToken.create({
            data: {
                token: hashToken(token),
                userId,
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
                expiresAt,
                loginProvider: 'LOCAL',
            },
        });
        return token;
    }
    async validate(token) {
        const record = await this.prisma.refreshToken.findUnique({
            where: { token: hashToken(token) },
        });
        if (!record || record.isRevoked || record.expiresAt < new Date()) {
            return null;
        }
        await this.prisma.refreshToken.update({
            where: { id: record.id },
            data: { lastActivityAt: new Date() },
        });
        return record;
    }
    async revoke(token) {
        await this.prisma.refreshToken.updateMany({
            where: { token: hashToken(token), isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
        });
    }
    async rotate(token, ipAddress, userAgent, rememberMe = false) {
        const record = await this.validate(token);
        if (!record)
            return null;
        await this.revoke(token);
        const newToken = await this.create(record.userId, ipAddress || record.ipAddress || undefined, userAgent || record.userAgent || undefined, rememberMe);
        return { accessToken: '', refreshToken: newToken };
    }
    async revokeAllForUser(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
        });
    }
};
exports.RefreshTokenService = RefreshTokenService;
exports.RefreshTokenService = RefreshTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        session_settings_service_1.SessionSettingsService])
], RefreshTokenService);
//# sourceMappingURL=refresh-token.service.js.map