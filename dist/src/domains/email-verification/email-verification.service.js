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
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
let EmailVerificationService = class EmailVerificationService {
    prisma;
    auditService;
    loggerService;
    tokenExpiryMs = 30 * 60 * 1000;
    constructor(prisma, auditService, loggerService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.loggerService = loggerService;
    }
    async send(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new exceptions_1.BusinessException('User not found', 'USER_001');
        if (user.isEmailVerified) {
            return { message: 'Email is already verified.' };
        }
        await this.prisma.emailVerificationToken.updateMany({
            where: { userId, verifiedAt: null, expiresAt: { gt: new Date() } },
            data: { expiresAt: new Date() },
        });
        const rawToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(rawToken).digest('hex');
        await this.prisma.emailVerificationToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + this.tokenExpiryMs),
            },
        });
        await this.auditService.log({
            action: 'EMAIL_VERIFICATION_REQUESTED',
            module: 'email',
            resource: 'user',
            userId,
            resourceId: userId,
        });
        this.loggerService.log({ action: 'send_verification', userId }, 'EmailVerificationService');
        return {
            message: 'Verification email sent.',
            ...(process.env.NODE_ENV !== 'production' && {
                verificationToken: rawToken,
            }),
        };
    }
    async resend(userId) {
        const result = await this.send(userId);
        await this.auditService.log({
            action: 'EMAIL_VERIFICATION_RESENT',
            module: 'email',
            resource: 'user',
            userId,
            resourceId: userId,
        });
        return result;
    }
    async verify(token) {
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
        const record = await this.prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
        });
        if (!record || record.verifiedAt || record.expiresAt < new Date()) {
            await this.auditService.log({
                action: record?.verifiedAt
                    ? 'EMAIL_VERIFICATION_TOKEN_EXPIRED'
                    : 'EMAIL_VERIFICATION_TOKEN_INVALID',
                module: 'email',
                resource: 'email_verification_token',
                metadata: {
                    reason: !record
                        ? 'not_found'
                        : record.verifiedAt
                            ? 'already_verified'
                            : 'expired',
                },
            });
            throw new exceptions_1.BusinessException('Invalid or expired verification token', 'EMAIL_001');
        }
        await this.prisma.emailVerificationToken.update({
            where: { id: record.id },
            data: { verifiedAt: new Date() },
        });
        await this.prisma.user.update({
            where: { id: record.userId },
            data: { isEmailVerified: true },
        });
        await this.auditService.log({
            action: 'EMAIL_VERIFIED',
            module: 'email',
            resource: 'user',
            userId: record.userId,
            resourceId: record.userId,
        });
        this.loggerService.log({ action: 'verify_email', userId: record.userId }, 'EmailVerificationService');
        return { message: 'Email verified successfully.' };
    }
    async validateToken(token) {
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
        const record = await this.prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
        });
        return {
            valid: !!(record && !record.verifiedAt && record.expiresAt > new Date()),
        };
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        logger_service_1.LoggerService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map