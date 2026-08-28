import { ReferralService } from './referral.service';
import { ApplyReferralDto, UpdateReferralRewardsDto, ReferralHistoryQueryDto } from './referral.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ReferralController {
    private readonly referralService;
    constructor(referralService: ReferralService);
    myCode(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    apply(user: JwtPayload, dto: ApplyReferralDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        status: string;
        createdAt: Date;
        referralCodeId: string;
        refereeId: string;
        referrerReward: number;
        refereeReward: number;
    }>>;
    rewards(user: JwtPayload, query: ReferralHistoryQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    adminList(page?: string, limit?: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    adminUpdate(id: string, dto: UpdateReferralRewardsDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
}
