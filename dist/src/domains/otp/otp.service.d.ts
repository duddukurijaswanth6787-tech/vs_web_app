import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { AuthService } from "../auth/auth.service";
import { AuthRepository } from "../auth/auth.repository";
import { PasswordService } from "../auth/services/password.service";
import { FirebaseAdminService } from "../auth/services/firebase-admin.service";
import { AuditService } from "../audit/audit.service";
import { OtpGatewayService } from "../otp-gateway/otp-gateway.service";
import { SendOtpDto, VerifyOtpDto, OtpLoginDto, FirebasePhoneLoginDto, SendOtpResponse } from './otp.types';
import type { AuthTokensResponse } from "../auth/auth.types";
export declare class OtpService {
    private readonly prisma;
    private readonly configService;
    private readonly authService;
    private readonly authRepository;
    private readonly passwordService;
    private readonly firebaseAdminService;
    private readonly auditService;
    private readonly otpGatewayService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, authService: AuthService, authRepository: AuthRepository, passwordService: PasswordService, firebaseAdminService: FirebaseAdminService, auditService: AuditService, otpGatewayService: OtpGatewayService);
    private normalizePhone;
    private hashCode;
    private generateCode;
    sendOtp(dto: SendOtpDto): Promise<SendOtpResponse>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        verified: boolean;
        phone: string;
    }>;
    loginWithOtp(dto: OtpLoginDto, ip?: string, userAgent?: string): Promise<AuthTokensResponse>;
    loginWithFirebasePhone(dto: FirebasePhoneLoginDto, ip?: string, userAgent?: string): Promise<AuthTokensResponse>;
    private findOrCreateUserByPhone;
}
