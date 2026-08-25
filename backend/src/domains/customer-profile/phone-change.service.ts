import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { OtpService } from '@domains/otp/otp.service';

/**
 * Changing a phone number is a credential change, not a profile edit: OTP
 * login resolves an account *by* its number, so whoever controls a number can
 * sign in as whoever owns it. Hence the number is only written after an OTP
 * proves the customer holds it, and never when it already belongs to someone
 * else.
 */
const PHONE_CHANGE_PURPOSE = 'PHONE_CHANGE';

@Injectable()
export class PhoneChangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Rejects a number already registered to a different account. Without this,
   * verifying a number you control would move it off its current owner and
   * lock them out of OTP login -- an account takeover with no password needed.
   */
  private async assertPhoneAvailable(phone: string, userId: string) {
    const owner = await this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
      select: { id: true },
    });
    if (owner && owner.id !== userId) {
      throw new BusinessException(
        'This phone number is already registered to another account',
        'PHONE_TAKEN',
      );
    }
  }

  async requestChange(userId: string, phone: string) {
    await this.assertPhoneAvailable(phone, userId);

    // Scoped to its own purpose so a code issued for logging in cannot be
    // replayed here, and vice versa.
    const result = await this.otpService.sendOtp({
      phone,
      purpose: PHONE_CHANGE_PURPOSE,
    });

    await this.auditService.log({
      action: 'PHONE_CHANGE_REQUESTED',
      module: 'customer-profile',
      resource: 'user',
      resourceId: userId,
      userId,
      newValue: { phone },
    });

    return result;
  }

  async confirmChange(userId: string, phone: string, code: string) {
    // Re-checked at confirm time: the number may have been claimed in the
    // window between requesting the code and entering it.
    await this.assertPhoneAvailable(phone, userId);

    const { verified } = await this.otpService.verifyOtp({
      phone,
      code,
      purpose: PHONE_CHANGE_PURPOSE,
    });
    if (!verified) {
      throw new BusinessException('Incorrect verification code', 'OTP_003');
    }

    // The number is the account's login credential and also what the profile
    // shows, so both rows move together or neither does.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { phone, isPhoneVerified: true },
      }),
      this.prisma.customerProfile.updateMany({
        where: { userId },
        data: { phone },
      }),
    ]);

    await this.auditService.log({
      action: 'PHONE_CHANGE_CONFIRMED',
      module: 'customer-profile',
      resource: 'user',
      resourceId: userId,
      userId,
      newValue: { phone },
    });

    return { phone, verified: true };
  }
}
