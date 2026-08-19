import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface ReferralCode {
  id: string;
  code: string;
  referrerName: string;
  rewardPoints: number;
  refereePoints: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface UpdateReferralDto {
  rewardPoints?: number;
  refereePoints?: number;
  usageLimit?: number;
  isActive?: boolean;
}

type ApiResponse<T> = StandardResponse<T>;

export const referralApi = {
  adminList: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ApiResponse<{ data: ReferralCode[]; meta: ReferralListMeta }>>('/referral/admin', {
      params: { page, limit },
    });
    return res.data.data!;
  },
  adminUpdate: async (id: string, dto: UpdateReferralDto) => {
    const res = await apiClient.patch<ApiResponse<ReferralCode>>(`/referral/admin/${id}`, dto);
    return res.data.data!;
  },
};
