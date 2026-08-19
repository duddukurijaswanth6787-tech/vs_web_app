import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { FeatureGateService } from '@common/feature-gate/feature-gate.service';
import { AuditService } from '@domains/audit/audit.service';
import {
  EarnLoyaltyDto,
  RedeemLoyaltyDto,
  AdminRedeemLoyaltyDto,
  LoyaltyHistoryQueryDto,
  LoyaltyBalanceResponse,
} from './loyalty.types';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureGate: FeatureGateService,
    private readonly auditService: AuditService,
  ) {}

  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    return profile;
  }

  private async getOrCreateAccount(customerId: string) {
    const existing = await this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
    });
    if (existing) return existing;
    return this.prisma.loyaltyAccount.create({ data: { customerId } });
  }

  private toBalance(a: any): LoyaltyBalanceResponse {
    return {
      customerId: a.customerId,
      pointsBalance: a.pointsBalance,
      lifetimeEarned: a.lifetimeEarned,
      lifetimeRedeemed: a.lifetimeRedeemed,
      tier: a.tier,
      isActive: a.isActive,
    };
  }

  private tierFor(lifetimeEarned: number): string {
    if (lifetimeEarned >= 10000) return 'PLATINUM';
    if (lifetimeEarned >= 5000) return 'GOLD';
    if (lifetimeEarned >= 1000) return 'SILVER';
    return 'BRONZE';
  }

  async getMyBalance(userId: string) {
    await this.featureGate.assertEnabled('loyalty', 'Loyalty points');
    const profile = await this.getProfileByUserId(userId);
    const account = await this.getOrCreateAccount(profile.id);
    return this.toBalance(account);
  }

  async getMyHistory(userId: string, query: LoyaltyHistoryQueryDto) {
    await this.featureGate.assertEnabled('loyalty', 'Loyalty points');
    const profile = await this.getProfileByUserId(userId);
    const account = await this.getOrCreateAccount(profile.id);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loyaltyTransaction.count({
        where: { accountId: account.id },
      }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async redeemMine(userId: string, dto: RedeemLoyaltyDto) {
    await this.featureGate.assertEnabled('loyalty', 'Loyalty points');
    const profile = await this.getProfileByUserId(userId);
    return this.redeemInternal(profile.id, dto.points, dto, userId);
  }

  async adminEarn(dto: EarnLoyaltyDto, adminId: string) {
    const account = await this.getOrCreateAccount(dto.customerId);
    const balanceAfter = account.pointsBalance + dto.points;
    const lifetimeEarned = account.lifetimeEarned + dto.points;
    const tier = this.tierFor(lifetimeEarned);
    const [updated] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: balanceAfter, lifetimeEarned, tier },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'EARN',
          points: dto.points,
          balanceAfter,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          description: dto.description ?? 'Points earned',
          createdBy: adminId,
        },
      }),
    ]);
    await this.auditService.log({
      action: 'LOYALTY_EARN',
      module: 'loyalty',
      resource: 'loyalty_account',
      resourceId: account.id,
      userId: adminId,
      newValue: { points: dto.points, balanceAfter },
    });
    return this.toBalance(updated);
  }

  async adminRedeem(dto: AdminRedeemLoyaltyDto, adminId: string) {
    return this.redeemInternal(dto.customerId, dto.points, dto, adminId);
  }

  async adminBalance(customerId: string) {
    const account = await this.getOrCreateAccount(customerId);
    return this.toBalance(account);
  }

  async getStats() {
    const [agg, activeMembers, tierCounts] = await Promise.all([
      this.prisma.loyaltyAccount.aggregate({
        _sum: { lifetimeEarned: true, lifetimeRedeemed: true },
      }),
      this.prisma.loyaltyAccount.count({ where: { isActive: true } }),
      this.prisma.loyaltyAccount.groupBy({
        by: ['tier'],
        _count: { tier: true },
      }),
    ]);
    return {
      totalPointsIssued: agg._sum.lifetimeEarned ?? 0,
      totalPointsRedeemed: agg._sum.lifetimeRedeemed ?? 0,
      activeMembers,
      tierBreakdown: tierCounts.map((t: any) => ({
        tier: t.tier,
        count: t._count.tier,
      })),
    };
  }

  private async redeemInternal(
    customerId: string,
    points: number,
    dto: { referenceType?: string; referenceId?: string; description?: string },
    actorId: string,
  ) {
    const account = await this.getOrCreateAccount(customerId);
    if (!account.isActive)
      throw new BusinessException('Loyalty account inactive', 'LOYALTY_001');
    if (account.pointsBalance < points) {
      throw new BusinessException('Insufficient loyalty points', 'LOYALTY_002');
    }
    const balanceAfter = account.pointsBalance - points;
    const lifetimeRedeemed = account.lifetimeRedeemed + points;
    const [updated] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: balanceAfter, lifetimeRedeemed },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'REDEEM',
          points: -points,
          balanceAfter,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          description: dto.description ?? 'Points redeemed',
          createdBy: actorId,
        },
      }),
    ]);
    await this.auditService.log({
      action: 'LOYALTY_REDEEM',
      module: 'loyalty',
      resource: 'loyalty_account',
      resourceId: account.id,
      userId: actorId,
      newValue: { points, balanceAfter },
    });
    return this.toBalance(updated);
  }
}
