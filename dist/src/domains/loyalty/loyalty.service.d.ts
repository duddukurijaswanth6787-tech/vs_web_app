import { PrismaService } from "../../database/prisma.service";
import { FeatureGateService } from "../../common/feature-gate/feature-gate.service";
import { AuditService } from "../audit/audit.service";
import { EarnLoyaltyDto, RedeemLoyaltyDto, AdminRedeemLoyaltyDto, LoyaltyHistoryQueryDto, LoyaltyBalanceResponse } from './loyalty.types';
export declare class LoyaltyService {
    private readonly prisma;
    private readonly featureGate;
    private readonly auditService;
    constructor(prisma: PrismaService, featureGate: FeatureGateService, auditService: AuditService);
    private getProfileByUserId;
    private getOrCreateAccount;
    private toBalance;
    private tierFor;
    getMyBalance(userId: string): Promise<LoyaltyBalanceResponse>;
    getMyHistory(userId: string, query: LoyaltyHistoryQueryDto): Promise<{
        data: {
            id: string;
            description: string | null;
            createdBy: string | null;
            createdAt: Date;
            type: string;
            referenceType: string | null;
            referenceId: string | null;
            balanceAfter: number;
            points: number;
            accountId: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    redeemMine(userId: string, dto: RedeemLoyaltyDto): Promise<LoyaltyBalanceResponse>;
    adminEarn(dto: EarnLoyaltyDto, adminId: string): Promise<LoyaltyBalanceResponse>;
    adminRedeem(dto: AdminRedeemLoyaltyDto, adminId: string): Promise<LoyaltyBalanceResponse>;
    adminBalance(customerId: string): Promise<LoyaltyBalanceResponse>;
    getStats(): Promise<{
        totalPointsIssued: number;
        totalPointsRedeemed: number;
        activeMembers: number;
        tierBreakdown: {
            tier: any;
            count: any;
        }[];
    }>;
    private redeemInternal;
}
