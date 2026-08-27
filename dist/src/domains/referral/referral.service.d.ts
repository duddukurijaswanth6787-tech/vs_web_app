import { PrismaService } from "../../database/prisma.service";
import { FeatureGateService } from "../../common/feature-gate/feature-gate.service";
import { AuditService } from "../audit/audit.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { ApplyReferralDto, UpdateReferralRewardsDto, ReferralHistoryQueryDto } from './referral.types';
export declare class ReferralService {
    private readonly prisma;
    private readonly featureGate;
    private readonly auditService;
    private readonly loyaltyService;
    constructor(prisma: PrismaService, featureGate: FeatureGateService, auditService: AuditService, loyaltyService: LoyaltyService);
    private getProfile;
    private generateCode;
    getOrCreateMyCode(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        usageLimit: number | null;
        usedCount: number;
        customerId: string;
        rewardPoints: number;
        refereePoints: number;
    }>;
    applyCode(userId: string, dto: ApplyReferralDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        referralCodeId: string;
        refereeId: string;
        referrerReward: number;
        refereeReward: number;
    }>;
    myHistory(userId: string, query: ReferralHistoryQueryDto): Promise<{
        data: {
            id: string;
            status: string;
            createdAt: Date;
            referralCodeId: string;
            refereeId: string;
            referrerReward: number;
            refereeReward: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    adminUpdateRewards(codeId: string, dto: UpdateReferralRewardsDto, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        usageLimit: number | null;
        usedCount: number;
        customerId: string;
        rewardPoints: number;
        refereePoints: number;
    }>;
    adminList(page?: number, limit?: number): Promise<{
        data: {
            id: string;
            code: string;
            referrerName: string;
            rewardPoints: number;
            refereePoints: number;
            usageLimit: number | null;
            usedCount: number;
            isActive: boolean;
            createdAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
