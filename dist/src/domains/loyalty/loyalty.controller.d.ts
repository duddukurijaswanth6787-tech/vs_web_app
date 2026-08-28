import { LoyaltyService } from './loyalty.service';
import { EarnLoyaltyDto, RedeemLoyaltyDto, AdminRedeemLoyaltyDto, LoyaltyHistoryQueryDto } from './loyalty.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class LoyaltyController {
    private readonly loyaltyService;
    constructor(loyaltyService: LoyaltyService);
    myBalance(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./loyalty.types").LoyaltyBalanceResponse>>;
    myHistory(user: JwtPayload, query: LoyaltyHistoryQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    redeem(user: JwtPayload, dto: RedeemLoyaltyDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./loyalty.types").LoyaltyBalanceResponse>>;
    adminStats(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        totalPointsIssued: number;
        totalPointsRedeemed: number;
        activeMembers: number;
        tierBreakdown: {
            tier: any;
            count: any;
        }[];
    }>>;
    adminBalance(customerId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./loyalty.types").LoyaltyBalanceResponse>>;
    adminEarn(user: JwtPayload, dto: EarnLoyaltyDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./loyalty.types").LoyaltyBalanceResponse>>;
    adminRedeem(user: JwtPayload, dto: AdminRedeemLoyaltyDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./loyalty.types").LoyaltyBalanceResponse>>;
}
