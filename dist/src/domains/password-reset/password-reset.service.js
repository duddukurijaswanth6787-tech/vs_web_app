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
exports.PasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const node_crypto_2 = require("node:crypto");
const prisma_service_1 = require("../../database/prisma.service");
const password_service_1 = require("../auth/services/password.service");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
let PasswordResetService = class PasswordResetService {
    prisma;
    passwordService;
    auditService;
    loggerService;
    emailService;
    configService;
    tokenExpiryMs = 15 * 60 * 1000;
    constructor(prisma, passwordService, auditService, loggerService, emailService, configService) {
        this.prisma = prisma;
        this.passwordService = passwordService;
        this.auditService = auditService;
        this.loggerService = loggerService;
        this.emailService = emailService;
        this.configService = configService;
    }
    async forgot(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            this.loggerService.warn({ action: 'forgot_password_unknown_email', email }, 'PasswordResetService');
            return {
                message: 'If an account with that email exists, a reset link has been generated.',
            };
        }
        const rawToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, node_crypto_2.createHash)('sha256').update(rawToken).digest('hex');
        await this.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
            data: { usedAt: new Date() },
        });
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + this.tokenExpiryMs),
            },
        });
        this.loggerService.log({ action: 'forgot_password', userId: user.id }, 'PasswordResetService');
        const frontendUrl = this.configService.get('app.frontendUrl', 'https://www.vsboutique.shop');
        const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;
        await this.emailService.sendPasswordResetEmail(user.email, resetUrl, user.id);
        return {
            message: 'If an account with that email exists, a reset link has been generated.',
            ...(process.env.NODE_ENV !== 'production' && { resetToken: rawToken }),
        };
    }
    async reset(token, newPassword, ipAddress, userAgent) {
        const tokenHash = (0, node_crypto_2.createHash)('sha256').update(token).digest('hex');
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });
        if (!record || record.usedAt || record.expiresAt < new Date()) {
            await this.auditService.log({
                action: 'PASSWORD_RESET_TOKEN_INVALID',
                module: 'password',
                resource: 'password_reset_token',
                metadata: {
                    reason: !record
                        ? 'not_found'
                        : record.usedAt
                            ? 'already_used'
                            : 'expired',
                },
            });
            throw new exceptions_1.BusinessException('Invalid or expired reset token', 'PWRESET_001');
        }
        await this.prisma.passwordResetToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        });
        const passwordHash = await this.passwordService.hash(newPassword);
        await this.prisma.user.update({
            where: { id: record.userId },
            data: { passwordHash },
        });
        await this.prisma.refreshToken.updateMany({
            where: { userId: record.userId, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'PASSWORD_RESET_COMPLETED',
            module: 'password',
            resource: 'user',
            userId: record.userId,
            ipAddress,
            userAgent,
        });
        await this.auditService.log({
            action: 'ALL_SESSIONS_REVOKED',
            module: 'session',
            resource: 'refresh_token',
            userId: record.userId,
        });
        this.loggerService.log({ action: 'reset_password', userId: record.userId }, 'PasswordResetService');
        return {
            message: 'Password reset successful. Please log in with your new password.',
        };
    }
    async validateToken(token) {
        const tokenHash = (0, node_crypto_2.createHash)('sha256').update(token).digest('hex');
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });
        const valid = !!(record && !record.usedAt && record.expiresAt > new Date());
        if (!valid) {
            await this.auditService.log({
                action: record && record.usedAt
                    ? 'PASSWORD_RESET_TOKEN_EXPIRED'
                    : 'PASSWORD_RESET_TOKEN_INVALID',
                module: 'password',
                resource: 'password_reset_token',
                metadata: {
                    reason: !record
                        ? 'not_found'
                        : record.usedAt
                            ? 'already_used'
                            : 'expired',
                },
            });
        }
        return { valid };
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        password_service_1.PasswordService,
        audit_service_1.AuditService,
        logger_service_1.LoggerService,
        email_service_1.EmailService,
        config_1.ConfigService])
], PasswordResetService);
//# sourceMappingURL=password-reset.service.js.map