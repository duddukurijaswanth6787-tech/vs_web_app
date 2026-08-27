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
exports.LoyaltyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const feature_gate_service_1 = require("../../common/feature-gate/feature-gate.service");
const audit_service_1 = require("../audit/audit.service");
let LoyaltyService = class LoyaltyService {
    prisma;
    featureGate;
    auditService;
    constructor(prisma, featureGate, auditService) {
        this.prisma = prisma;
        this.featureGate = featureGate;
        this.auditService = auditService;
    }
    async getProfileByUserId(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        return profile;
    }
    async getOrCreateAccount(customerId) {
        const existing = await this.prisma.loyaltyAccount.findUnique({
            where: { customerId },
        });
        if (existing)
            return existing;
        return this.prisma.loyaltyAccount.create({ data: { customerId } });
    }
    toBalance(a) {
        return {
            customerId: a.customerId,
            pointsBalance: a.pointsBalance,
            lifetimeEarned: a.lifetimeEarned,
            lifetimeRedeemed: a.lifetimeRedeemed,
            tier: a.tier,
            isActive: a.isActive,
        };
    }
    tierFor(lifetimeEarned) {
        if (lifetimeEarned >= 10000)
            return 'PLATINUM';
        if (lifetimeEarned >= 5000)
            return 'GOLD';
        if (lifetimeEarned >= 1000)
            return 'SILVER';
        return 'BRONZE';
    }
    async getMyBalance(userId) {
        await this.featureGate.assertEnabled('loyalty', 'Loyalty points');
        const profile = await this.getProfileByUserId(userId);
        const account = await this.getOrCreateAccount(profile.id);
        return this.toBalance(account);
    }
    async getMyHistory(userId, query) {
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
    async redeemMine(userId, dto) {
        await this.featureGate.assertEnabled('loyalty', 'Loyalty points');
        const profile = await this.getProfileByUserId(userId);
        return this.redeemInternal(profile.id, dto.points, dto, userId);
    }
    async adminEarn(dto, adminId) {
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
    async adminRedeem(dto, adminId) {
        return this.redeemInternal(dto.customerId, dto.points, dto, adminId);
    }
    async adminBalance(customerId) {
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
            tierBreakdown: tierCounts.map((t) => ({
                tier: t.tier,
                count: t._count.tier,
            })),
        };
    }
    async redeemInternal(customerId, points, dto, actorId) {
        const account = await this.getOrCreateAccount(customerId);
        if (!account.isActive)
            throw new exceptions_1.BusinessException('Loyalty account inactive', 'LOYALTY_001');
        if (account.pointsBalance < points) {
            throw new exceptions_1.BusinessException('Insufficient loyalty points', 'LOYALTY_002');
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
};
exports.LoyaltyService = LoyaltyService;
exports.LoyaltyService = LoyaltyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        feature_gate_service_1.FeatureGateService,
        audit_service_1.AuditService])
], LoyaltyService);
//# sourceMappingURL=loyalty.service.js.map