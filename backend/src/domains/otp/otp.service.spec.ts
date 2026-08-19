import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { PrismaService } from '@database/prisma.service';
import { AuthService } from '@domains/auth/auth.service';
import { AuthRepository } from '@domains/auth/auth.repository';
import { PasswordService } from '@domains/auth/services/password.service';
import { FirebaseAdminService } from '@domains/auth/services/firebase-admin.service';
import { AuditService } from '@domains/audit/audit.service';
import { AuthenticationException } from '@common/exceptions';

describe('OtpService.loginWithFirebasePhone', () => {
  let service: OtpService;
  let authRepository: Record<string, jest.Mock>;
  let authService: Record<string, jest.Mock>;
  let firebaseAdminService: Record<string, jest.Mock>;
  let prisma: any;

  beforeEach(async () => {
    authRepository = {
      findByPhone: jest.fn(),
      createUser: jest.fn(),
      findRoleByName: jest.fn().mockResolvedValue({ id: 'role-customer' }),
      assignRole: jest.fn(),
      findById: jest.fn(),
    };
    authService = {
      issueTokensForUser: jest
        .fn()
        .mockResolvedValue({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    };
    firebaseAdminService = {
      verifyPhoneIdToken: jest.fn(),
    };
    prisma = {
      user: { update: jest.fn() },
      customerProfile: { findUnique: jest.fn(), create: jest.fn() },
      otpChallenge: { updateMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      smsLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AuthService, useValue: authService },
        { provide: AuthRepository, useValue: authRepository },
        { provide: PasswordService, useValue: { hash: jest.fn().mockResolvedValue('hashed') } },
        { provide: FirebaseAdminService, useValue: firebaseAdminService },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  it('propagates the FirebaseAdminService verification failure without touching the DB', async () => {
    firebaseAdminService.verifyPhoneIdToken.mockRejectedValue(
      new AuthenticationException('Invalid or expired Firebase ID token', 'FIREBASE_001'),
    );

    await expect(
      service.loginWithFirebasePhone({ idToken: 'bad-token' }),
    ).rejects.toMatchObject({ errorCode: 'FIREBASE_001' });
    expect(authRepository.findByPhone).not.toHaveBeenCalled();
  });

  it('logs in an existing user found by the verified phone number', async () => {
    firebaseAdminService.verifyPhoneIdToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      phone: '+919876543210',
    });
    authRepository.findByPhone.mockResolvedValue({ id: 'user-1' });
    prisma.customerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });

    const result = await service.loginWithFirebasePhone({ idToken: 'good-token' });

    // normalizePhone strips non-digits and keeps the last 10 -- +919876543210 -> 9876543210
    expect(authRepository.findByPhone).toHaveBeenCalledWith('9876543210');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isPhoneVerified: true },
    });
    expect(authRepository.createUser).not.toHaveBeenCalled();
    expect(authService.issueTokensForUser).toHaveBeenCalledWith(
      'user-1',
      undefined,
      undefined,
      false,
    );
    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 });
  });

  it('provisions a new customer account when no user has this phone yet', async () => {
    firebaseAdminService.verifyPhoneIdToken.mockResolvedValue({
      uid: 'firebase-uid-2',
      phone: '+919000011111',
    });
    authRepository.findByPhone.mockResolvedValue(null);
    authRepository.createUser.mockResolvedValue({ id: 'user-2' });
    authRepository.findById.mockResolvedValue({ id: 'user-2' });

    await service.loginWithFirebasePhone({ idToken: 'good-token', firstName: 'Anjali' });

    expect(authRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '9000011111', firstName: 'Anjali', isPhoneVerified: true }),
    );
    expect(authRepository.assignRole).toHaveBeenCalledWith('user-2', 'role-customer');
    expect(prisma.customerProfile.create).toHaveBeenCalledWith({
      data: { userId: 'user-2', phone: '9000011111' },
    });
    expect(authService.issueTokensForUser).toHaveBeenCalledWith('user-2', undefined, undefined, false);
  });
});
