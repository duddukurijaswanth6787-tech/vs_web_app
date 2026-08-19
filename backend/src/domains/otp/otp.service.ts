import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '@database/prisma.service';
import { BusinessException, AuthenticationException } from '@common/exceptions';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';
import { AuthService } from '@domains/auth/auth.service';
import { AuthRepository } from '@domains/auth/auth.repository';
import { PasswordService } from '@domains/auth/services/password.service';
import { FirebaseAdminService } from '@domains/auth/services/firebase-admin.service';
import { AuditService } from '@domains/audit/audit.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  OtpLoginDto,
  FirebasePhoneLoginDto,
  SendOtpResponse,
} from './otp.types';
import type { AuthTokensResponse } from '@domains/auth/auth.types';

@Injectable()
export class OtpService {
  private readonly logger = new Logger('OtpService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly auditService: AuditService,
  ) {}

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10);
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendOtp(dto: SendOtpDto): Promise<SendOtpResponse> {
    const phone = this.normalizePhone(dto.phone);
    const purpose = dto.purpose ?? 'LOGIN';
    const code = this.generateCode();
    const expiryMinutes = IDENTITY_CONSTANTS.OTP_EXPIRY_MINUTES;
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

    const smsEnabled = this.configService.get<boolean>(
      'app.features.sms',
      false,
    );
    if (smsEnabled) {
      await this.prisma.smsLog.create({
        data: {
          userId: user?.id,
          phone,
          template: 'OTP_LOGIN',
          message: `Your Vasanthi's Signature OTP is ${code}. Valid for ${expiryMinutes} minutes.`,
          status: 'QUEUED',
          metadata: { purpose },
        },
      });
    }

    // Always print OTP in backend terminal for local/dev testing
    this.logger.log('================================================');
    this.logger.log(` OTP SENT  | phone: ${phone} | purpose: ${purpose}`);
    this.logger.log(` OTP CODE  | ${code}`);
    this.logger.log(` Expires in ${expiryMinutes} minutes`);
    this.logger.log('================================================');
    // Also print plain console so it is easy to spot in nest logs

    console.log(
      `\n>>> [OTP] phone=${phone} code=${code} purpose=${purpose} <<<\n`,
    );

    await this.auditService.log({
      action: 'OTP_SENT',
      module: 'otp',
      resource: 'otp_challenge',
      resourceId: phone,
      newValue: { purpose, phone },
    });

    const isDev =
      this.configService.get<string>('app.env') !== 'production' &&
      process.env.NODE_ENV !== 'production';
    return {
      phone,
      expiresInSeconds: expiryMinutes * 60,
      purpose,
      ...(isDev ? { devCode: code } : {}),
    };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ verified: boolean; phone: string }> {
    const phone = this.normalizePhone(dto.phone);
    const purpose = dto.purpose ?? 'LOGIN';
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, purpose, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new BusinessException('OTP expired or not found', 'OTP_001');
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      throw new BusinessException('OTP max attempts exceeded', 'OTP_002');
    }
    const valid = challenge.codeHash === this.hashCode(dto.code);
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: { increment: 1 },
        ...(valid ? { verifiedAt: new Date() } : {}),
      },
    });
    if (!valid) throw new AuthenticationException('Invalid OTP', 'OTP_003');
    return { verified: true, phone };
  }

  async loginWithOtp(
    dto: OtpLoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokensResponse> {
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

    return this.authService.issueTokensForUser(
      user.id,
      ip,
      userAgent,
      dto.rememberMe ?? false,
    );
  }

  /**
   * Phone login where Firebase (not our own OtpChallenge/SMS pipeline)
   * handled sending the SMS and checking the code the user typed. The
   * frontend hands us the Firebase ID token it got back from
   * `confirmationResult.confirm(code)`; we verify that token was really
   * signed by Firebase for this project (FirebaseAdminService) before
   * trusting its `phone_number` claim, so a client can't just POST an
   * arbitrary phone number and log in as someone else.
   */
  async loginWithFirebasePhone(
    dto: FirebasePhoneLoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokensResponse> {
    const { phone: rawPhone } = await this.firebaseAdminService.verifyPhoneIdToken(
      dto.idToken,
    );
    const phone = this.normalizePhone(rawPhone);
    const user = await this.findOrCreateUserByPhone(phone, dto.firstName);

    await this.auditService.log({
      action: 'FIREBASE_OTP_LOGIN',
      module: 'otp',
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
    });

    return this.authService.issueTokensForUser(
      user.id,
      ip,
      userAgent,
      dto.rememberMe ?? false,
    );
  }

  /** Finds the user for a verified phone number, or provisions a new customer account for it. */
  private async findOrCreateUserByPhone(phone: string, firstName?: string) {
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
      const role = await this.authRepository.findRoleByName(
        IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE,
      );
      if (role) await this.authRepository.assignRole(created.id, role.id);
      await this.prisma.customerProfile.create({
        data: { userId: created.id, phone },
      });
      user = await this.authRepository.findById(created.id);
    } else {
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

    if (!user) throw new AuthenticationException('Unable to login', 'OTP_004');
    return user;
  }
}
