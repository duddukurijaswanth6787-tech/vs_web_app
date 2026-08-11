import { apiClient } from '@/lib/api/client';

export interface LoyaltyBalance {
  customerId: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface EarnPointsDto {
  customerId: string;
  points: number;
  reason: string;
}

export interface RedeemPointsDto {
  customerId: string;
  points: number;
  reason: string;
}

export const loyaltyApi = {
  getMyBalance: async () => {
    const res = await apiClient.get<LoyaltyBalance>('/loyalty/balance');
    return res.data;
  },
  getCustomerBalance: async (customerId: string) => {
    const res = await apiClient.get<LoyaltyBalance>(`/loyalty/admin/customer/${customerId}`);
    return res.data;
  },
  earnPoints: async (dto: EarnPointsDto) => {
    const res = await apiClient.post('/loyalty/admin/earn', dto);
    return res.data;
  },
  redeemPoints: async (dto: RedeemPointsDto) => {
    const res = await apiClient.post('/loyalty/admin/redeem', dto);
    return res.data;
  },
};
