export declare class EarnLoyaltyDto {
    customerId: string;
    points: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
}
export declare class RedeemLoyaltyDto {
    points: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
}
export declare class AdminRedeemLoyaltyDto extends RedeemLoyaltyDto {
    customerId: string;
}
export declare class LoyaltyHistoryQueryDto {
    page?: number;
    limit?: number;
}
export declare class LoyaltyBalanceResponse {
    customerId: string;
    pointsBalance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    tier: string;
    isActive: boolean;
}
export declare class LoyaltyStatsResponse {
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    activeMembers: number;
    tierBreakdown: {
        tier: string;
        count: number;
    }[];
}
