import { PhoneChangeService } from './phone-change.service';

/**
 * Phone is a login credential: OTP login resolves an account by its number.
 * These pin the two rules that keep that from becoming an account takeover --
 * a number in use elsewhere is refused, and the number is only written once an
 * OTP proves the caller holds it.
 */
describe('PhoneChangeService', () => {
  const buildService = ({
    phoneOwnedBy = null as string | null,
    otpVerified = true,
  } = {}) => {
    const prisma = {
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue(phoneOwnedBy ? { id: phoneOwnedBy } : null),
        update: jest.fn().mockResolvedValue({}),
      },
      customerProfile: { updateMany: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const otp = {
      sendOtp: jest.fn().mockResolvedValue({ phone: '9', expiresInSeconds: 300 }),
      verifyOtp: jest.fn().mockResolvedValue({ verified: otpVerified, phone: '9' }),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };

    return {
      service: new PhoneChangeService(prisma as never, otp as never, audit as never),
      prisma,
      otp,
    };
  };

  it('refuses a number registered to another account', async () => {
    // Allowing this would move the number off its owner and lock them out of
    // OTP login -- takeover with no password required.
    const { service, otp } = buildService({ phoneOwnedBy: 'someone-else' });

    await expect(service.requestChange('user-1', '07660922416')).rejects.toThrow(
      /already registered/i,
    );
    expect(otp.sendOtp).not.toHaveBeenCalled();
  });

  it('allows re-verifying a number the caller already owns', async () => {
    const { service, otp } = buildService({ phoneOwnedBy: 'user-1' });

    await expect(service.requestChange('user-1', '07660922416')).resolves.toBeDefined();
    expect(otp.sendOtp).toHaveBeenCalled();
  });

  it('scopes the code to PHONE_CHANGE so a login code cannot be replayed', async () => {
    const { service, otp } = buildService();

    await service.requestChange('user-1', '07660922416');

    expect(otp.sendOtp).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: 'PHONE_CHANGE' }),
    );
  });

  it('does not write the number when the code is wrong', async () => {
    const { service, prisma } = buildService({ otpVerified: false });

    await expect(
      service.confirmChange('user-1', '07660922416', '000000'),
    ).rejects.toThrow(/incorrect/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('re-checks availability at confirm time, not just at request time', async () => {
    // The number can be claimed in the window between requesting the code and
    // entering it.
    const { service, prisma } = buildService({ phoneOwnedBy: 'someone-else' });

    await expect(
      service.confirmChange('user-1', '07660922416', '123456'),
    ).rejects.toThrow(/already registered/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('writes user and profile together, and marks the number verified', async () => {
    const { service, prisma } = buildService();

    await service.confirmChange('user-1', '07660922416', '123456');

    // One transaction: the credential and the displayed number must not diverge.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { phone: '07660922416', isPhoneVerified: true },
    });
    expect(prisma.customerProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { phone: '07660922416' },
    });
  });
});
