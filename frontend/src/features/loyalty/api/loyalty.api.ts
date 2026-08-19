import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface LoyaltyBalance {
  customerId: string;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isActive: boolean;
}

export interface LoyaltyStats {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeMembers: number;
  tierBreakdown: { tier: string; count: number }[];
}

export interface EarnPointsDto {
  customerId: string;
  points: number;
  description?: string;
}

export interface RedeemPointsDto {
  customerId: string;
  points: number;
  description?: string;
}

type ApiResponse<T> = StandardResponse<T>;

export const loyaltyApi = {
  getMyBalance: async () => {
    const res = await apiClient.get<ApiResponse<LoyaltyBalance>>('/loyalty/balance');
    return res.data.data!;
  },
  getCustomerBalance: async (customerId: string) => {
    const res = await apiClient.get<ApiResponse<LoyaltyBalance>>(`/loyalty/admin/customer/${customerId}`);
    return res.data.data!;
  },
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<LoyaltyStats>>('/loyalty/admin/stats');
    return res.data.data!;
  },
  earnPoints: async (dto: EarnPointsDto) => {
    const res = await apiClient.post<ApiResponse<LoyaltyBalance>>('/loyalty/admin/earn', dto);
    return res.data.data!;
  },
  redeemPoints: async (dto: RedeemPointsDto) => {
    const res = await apiClient.post<ApiResponse<LoyaltyBalance>>('/loyalty/admin/redeem', dto);
    return res.data.data!;
  },
};
