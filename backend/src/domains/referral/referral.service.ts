import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { FeatureGateService } from '@common/feature-gate/feature-gate.service';
import { AuditService } from '@domains/audit/audit.service';
import { LoyaltyService } from '@domains/loyalty/loyalty.service';
import {
  ApplyReferralDto,
  UpdateReferralRewardsDto,
  ReferralHistoryQueryDto,
} from './referral.types';
import * as crypto from 'crypto';

@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureGate: FeatureGateService,
    private readonly auditService: AuditService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  private async getProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    return profile;
  }

  private generateCode(firstName?: string): string {
    const prefix =
      (firstName || 'VD')
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 6)
        .toUpperCase() || 'VD';
    return `${prefix}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }

  async getOrCreateMyCode(userId: string) {
    await this.featureGate.assertEnabled('referral', 'Referral program');
    const profile = await this.getProfile(userId);
    const existing = await this.prisma.referralCode.findUnique({
      where: { customerId: profile.id },
    });
    if (existing) return existing;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    let code = this.generateCode(user?.firstName);
    while (await this.prisma.referralCode.findUnique({ where: { code } })) {
      code = this.generateCode(user?.firstName);
    }
    const created = await this.prisma.referralCode.create({
      data: { customerId: profile.id, code },
    });
    await this.auditService.log({
      action: 'REFERRAL_CODE_CREATED',
      module: 'referral',
      resource: 'referral_code',
      resourceId: created.id,
      userId,
      newValue: { code },
    });
    return created;
  }

  async applyCode(userId: string, dto: ApplyReferralDto) {
    await this.featureGate.assertEnabled('referral', 'Referral program');
    const profile = await this.getProfile(userId);
    const referral = await this.prisma.referralCode.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (!referral || !referral.isActive) {
      throw new BusinessException('Invalid referral code', 'REFERRAL_001');
    }
    if (referral.customerId === profile.id) {
      throw new BusinessException(
        'Cannot apply your own referral code',
        'REFERRAL_002',
      );
    }
    if (
      referral.usageLimit != null &&
      referral.usedCount >= referral.usageLimit
    ) {
      throw new BusinessException(
        'Referral code usage limit reached',
        'REFERRAL_003',
      );
    }
    const already = await this.prisma.referralRedemption.findUnique({
      where: {
        referralCodeId_refereeId: {
          referralCodeId: referral.id,
          refereeId: profile.id,
        },
      },
    });
    if (already)
      throw new BusinessException('Referral already applied', 'REFERRAL_004');

    const redemption = await this.prisma.$transaction(async (tx) => {
      const r = await tx.referralRedemption.create({
        data: {
          referralCodeId: referral.id,
          refereeId: profile.id,
          referrerReward: referral.rewardPoints,
          refereeReward: referral.refereePoints,
          status: 'COMPLETED',
        },
      });
      await tx.referralCode.update({
        where: { id: referral.id },
        data: { usedCount: { increment: 1 } },
      });
      return r;
    });

    // Credit loyalty points when loyalty feature is on; otherwise still record referral
    const loyaltyOn = await this.featureGate.isEnabled('loyalty');
    if (loyaltyOn) {
      if (referral.rewardPoints > 0) {
        await this.loyaltyService.adminEarn(
          {
            customerId: referral.customerId,
            points: referral.rewardPoints,
            referenceType: 'REFERRAL',
            referenceId: redemption.id,
            description: 'Referral reward',
          },
          userId,
        );
      }
      if (referral.refereePoints > 0) {
        await this.loyaltyService.adminEarn(
          {
            customerId: profile.id,
            points: referral.refereePoints,
            referenceType: 'REFERRAL',
            referenceId: redemption.id,
            description: 'Referral welcome bonus',
          },
          userId,
        );
      }
    }

    await this.auditService.log({
      action: 'REFERRAL_APPLIED',
      module: 'referral',
      resource: 'referral_redemption',
      resourceId: redemption.id,
      userId,
      newValue: { code: referral.code },
    });
    return redemption;
  }

  async myHistory(userId: string, query: ReferralHistoryQueryDto) {
    await this.featureGate.assertEnabled('referral', 'Referral program');
    const profile = await this.getProfile(userId);
    const code = await this.prisma.referralCode.findUnique({
      where: { customerId: profile.id },
    });
    if (!code) return { data: [], meta: { page: 1, limit: 20, total: 0 } };
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [data, total] = await Promise.all([
      this.prisma.referralRedemption.findMany({
        where: { referralCodeId: code.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.referralRedemption.count({
        where: { referralCodeId: code.id },
      }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  async adminUpdateRewards(
    codeId: string,
    dto: UpdateReferralRewardsDto,
    adminId: string,
  ) {
    const updated = await this.prisma.referralCode.update({
      where: { id: codeId },
      data: {
        rewardPoints: dto.rewardPoints,
        refereePoints: dto.refereePoints,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive,
      },
    });
    await this.auditService.log({
      action: 'REFERRAL_REWARDS_UPDATED',
      module: 'referral',
      resource: 'referral_code',
      resourceId: codeId,
      userId: adminId,
      newValue: dto as any,
    });
    return updated;
  }

  async adminList(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const [data, total] = await Promise.all([
      this.prisma.referralCode.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.referralCode.count(),
    ]);
    return { data, meta: { page, limit: take, total } };
  }
}
