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
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const feature_gate_service_1 = require("../../common/feature-gate/feature-gate.service");
const audit_service_1 = require("../audit/audit.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const crypto = __importStar(require("crypto"));
let ReferralService = class ReferralService {
    prisma;
    featureGate;
    auditService;
    loyaltyService;
    constructor(prisma, featureGate, auditService, loyaltyService) {
        this.prisma = prisma;
        this.featureGate = featureGate;
        this.auditService = auditService;
        this.loyaltyService = loyaltyService;
    }
    async getProfile(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        return profile;
    }
    generateCode(firstName) {
        const prefix = (firstName || 'VD')
            .replace(/[^a-zA-Z]/g, '')
            .slice(0, 6)
            .toUpperCase() || 'VD';
        return `${prefix}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    }
    async getOrCreateMyCode(userId) {
        await this.featureGate.assertEnabled('referral', 'Referral program');
        const profile = await this.getProfile(userId);
        const existing = await this.prisma.referralCode.findUnique({
            where: { customerId: profile.id },
        });
        if (existing)
            return existing;
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
    async applyCode(userId, dto) {
        await this.featureGate.assertEnabled('referral', 'Referral program');
        const profile = await this.getProfile(userId);
        const referral = await this.prisma.referralCode.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (!referral || !referral.isActive) {
            throw new exceptions_1.BusinessException('Invalid referral code', 'REFERRAL_001');
        }
        if (referral.customerId === profile.id) {
            throw new exceptions_1.BusinessException('Cannot apply your own referral code', 'REFERRAL_002');
        }
        if (referral.usageLimit != null &&
            referral.usedCount >= referral.usageLimit) {
            throw new exceptions_1.BusinessException('Referral code usage limit reached', 'REFERRAL_003');
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
            throw new exceptions_1.BusinessException('Referral already applied', 'REFERRAL_004');
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
        const loyaltyOn = await this.featureGate.isEnabled('loyalty');
        if (loyaltyOn) {
            if (referral.rewardPoints > 0) {
                await this.loyaltyService.adminEarn({
                    customerId: referral.customerId,
                    points: referral.rewardPoints,
                    referenceType: 'REFERRAL',
                    referenceId: redemption.id,
                    description: 'Referral reward',
                }, userId);
            }
            if (referral.refereePoints > 0) {
                await this.loyaltyService.adminEarn({
                    customerId: profile.id,
                    points: referral.refereePoints,
                    referenceType: 'REFERRAL',
                    referenceId: redemption.id,
                    description: 'Referral welcome bonus',
                }, userId);
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
    async myHistory(userId, query) {
        await this.featureGate.assertEnabled('referral', 'Referral program');
        const profile = await this.getProfile(userId);
        const code = await this.prisma.referralCode.findUnique({
            where: { customerId: profile.id },
        });
        if (!code)
            return { data: [], meta: { page: 1, limit: 20, total: 0 } };
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
    async adminUpdateRewards(codeId, dto, adminId) {
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
            newValue: dto,
        });
        return updated;
    }
    async adminList(page = 1, limit = 20) {
        const take = Math.min(limit, 100);
        const [rows, total] = await Promise.all([
            this.prisma.referralCode.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
                include: {
                    customer: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                },
            }),
            this.prisma.referralCode.count(),
        ]);
        const data = rows.map((r) => ({
            id: r.id,
            code: r.code,
            referrerName: [r.customer.user.firstName, r.customer.user.lastName]
                .filter(Boolean)
                .join(' ')
                .trim(),
            rewardPoints: r.rewardPoints,
            refereePoints: r.refereePoints,
            usageLimit: r.usageLimit,
            usedCount: r.usedCount,
            isActive: r.isActive,
            createdAt: r.createdAt,
        }));
        return { data, meta: { page, limit: take, total } };
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        feature_gate_service_1.FeatureGateService,
        audit_service_1.AuditService,
        loyalty_service_1.LoyaltyService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map