"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const identity_constants_1 = require("../../shared/identity/identity.constants");
const auth_service_1 = require("../auth/auth.service");
const auth_repository_1 = require("../auth/auth.repository");
const password_service_1 = require("../auth/services/password.service");
const firebase_admin_service_1 = require("../auth/services/firebase-admin.service");
const audit_service_1 = require("../audit/audit.service");
const otp_gateway_service_1 = require("../otp-gateway/otp-gateway.service");
let OtpService = class OtpService {
    prisma;
    configService;
    authService;
    authRepository;
    passwordService;
    firebaseAdminService;
    auditService;
    otpGatewayService;
    logger = new common_1.Logger('OtpService');
    constructor(prisma, configService, authService, authRepository, passwordService, firebaseAdminService, auditService, otpGatewayService) {
        this.prisma = prisma;
        this.configService = configService;
        this.authService = authService;
        this.authRepository = authRepository;
        this.passwordService = passwordService;
        this.firebaseAdminService = firebaseAdminService;
        this.auditService = auditService;
        this.otpGatewayService = otpGatewayService;
    }
    normalizePhone(phone) {
        return phone.replace(/\D/g, '').slice(-10);
    }
    hashCode(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
    generateCode() {
        return String(crypto.randomInt(100000, 1000000));
    }
    async sendOtp(dto) {
        const phone = this.normalizePhone(dto.phone);
        const purpose = dto.purpose ?? 'LOGIN';
        const code = this.generateCode();
        const expiryMinutes = await this.otpGatewayService.getExpiryMinutes();
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        await this.prisma.otpChallenge.updateMany({
            where: { phone, purpose, verifiedAt: null },
            data: { expiresAt: new Date() },
        });
        const user = await this.authRepository.findByPhone(phone);
        await this.prisma.otpChallenge.create({
            data: {
                phone,
                codeHash: this.hashCode(code),
                purpose,
                expiresAt,
                userId: user?.id,
            },
        });
        await this.otpGatewayService.sendOtp({
            phone,
            code,
            purpose,
            expiryMinutes,
            userId: user?.id,
        });
        const isDev = this.configService.get('app.env') !== 'production' &&
            process.env.NODE_ENV !== 'production';
        if (isDev) {
            this.logger.log('================================================');
            this.logger.log(` OTP SENT  | phone: ${phone} | purpose: ${purpose}`);
            this.logger.log(` OTP CODE  | ${code}`);
            this.logger.log(` Expires in ${expiryMinutes} minutes`);
            this.logger.log('================================================');
        }
        await this.auditService.log({
            action: 'OTP_SENT',
            module: 'otp',
            resource: 'otp_challenge',
            resourceId: phone,
            newValue: { purpose, phone },
        });
        return {
            phone,
            expiresInSeconds: expiryMinutes * 60,
            purpose,
            ...(isDev ? { devCode: code } : {}),
        };
    }
    async verifyOtp(dto) {
        const phone = this.normalizePhone(dto.phone);
        const purpose = dto.purpose ?? 'LOGIN';
        const challenge = await this.prisma.otpChallenge.findFirst({
            where: { phone, purpose, verifiedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!challenge || challenge.expiresAt < new Date()) {
            throw new exceptions_1.BusinessException('OTP expired or not found', 'OTP_001');
        }
        if (challenge.attempts >= challenge.maxAttempts) {
            throw new exceptions_1.BusinessException('OTP max attempts exceeded', 'OTP_002');
        }
        const valid = challenge.codeHash === this.hashCode(dto.code);
        await this.prisma.otpChallenge.update({
            where: { id: challenge.id },
            data: {
                attempts: { increment: 1 },
                ...(valid ? { verifiedAt: new Date() } : {}),
            },
        });
        if (!valid)
            throw new exceptions_1.AuthenticationException('Invalid OTP', 'OTP_003');
        return { verified: true, phone };
    }
    async loginWithOtp(dto, ip, userAgent) {
        await this.verifyOtp({
            phone: dto.phone,
            code: dto.code,
            purpose: 'LOGIN',
        });
        const phone = this.normalizePhone(dto.phone);
        const user = await this.findOrCreateUserByPhone(phone, dto.firstName);
        await this.auditService.log({
            action: 'OTP_LOGIN',
            module: 'otp',
            resource: 'user',
            resourceId: user.id,
            userId: user.id,
        });
        return this.authService.issueTokensForUser(user.id, ip, userAgent, dto.rememberMe ?? false);
    }
    async loginWithFirebasePhone(dto, ip, userAgent) {
        const { phone: rawPhone } = await this.firebaseAdminService.verifyPhoneIdToken(dto.idToken);
        const phone = this.normalizePhone(rawPhone);
        const user = await this.findOrCreateUserByPhone(phone, dto.firstName);
        await this.auditService.log({
            action: 'FIREBASE_OTP_LOGIN',
            module: 'otp',
            resource: 'user',
            resourceId: user.id,
            userId: user.id,
        });
        return this.authService.issueTokensForUser(user.id, ip, userAgent, dto.rememberMe ?? false);
    }
    async findOrCreateUserByPhone(phone, firstName) {
        let user = await this.authRepository.findByPhone(phone);
        if (!user) {
            const passwordHash = await this.passwordService.hash(crypto.randomUUID());
            const email = `otp_${phone}@vasanthi.local`;
            const created = await this.authRepository.createUser({
                email,
                passwordHash,
                firstName: firstName?.trim() || 'Customer',
                phone,
                isPhoneVerified: true,
            });
            const role = await this.authRepository.findRoleByName(identity_constants_1.IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE);
            if (role)
                await this.authRepository.assignRole(created.id, role.id);
            await this.prisma.customerProfile.create({
                data: { userId: created.id, phone },
            });
            user = await this.authRepository.findById(created.id);
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isPhoneVerified: true },
            });
            const profile = await this.prisma.customerProfile.findUnique({
                where: { userId: user.id },
            });
            if (!profile) {
                await this.prisma.customerProfile.create({
                    data: { userId: user.id, phone },
                });
            }
        }
        if (!user)
            throw new exceptions_1.AuthenticationException('Unable to login', 'OTP_004');
        return user;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        auth_service_1.AuthService,
        auth_repository_1.AuthRepository,
        password_service_1.PasswordService,
        firebase_admin_service_1.FirebaseAdminService,
        audit_service_1.AuditService,
        otp_gateway_service_1.OtpGatewayService])
], OtpService);
//# sourceMappingURL=otp.service.js.map