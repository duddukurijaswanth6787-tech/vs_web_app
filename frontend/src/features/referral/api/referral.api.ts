import { apiClient } from '@/lib/api/client';

export interface ReferralCode {
  id: string;
  code: string;
  referrerId: string;
  rewardAmount: number;
  totalReferrals: number;
  createdAt: string;
}

export interface UpdateReferralDto {
  rewardAmount?: number;
  status?: string;
}

export const referralApi = {
  adminList: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ReferralCode[]>(`/referral/admin?page=${page}&limit=${limit}`);
    return res.data;
  },
  adminUpdate: async (id: string, dto: UpdateReferralDto) => {
    const res = await apiClient.patch(`/referral/admin/${id}`, dto);
    return res.data;
  },
};
