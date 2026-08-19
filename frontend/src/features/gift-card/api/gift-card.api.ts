import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface GiftCard {
  id: string;
  code: string;
  initialAmount: number;
  balance: number;
  currency: string;
  status: string;
  recipientEmail?: string;
  recipientPhone?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface GiftCardListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface CreateGiftCardDto {
  amount: number;
  code?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  expiresAt?: string;
}

type ApiResponse<T> = StandardResponse<T>;

export const giftCardApi = {
  adminList: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ApiResponse<{ data: GiftCard[]; meta: GiftCardListMeta }>>('/gift-cards', {
      params: { page, limit },
    });
    return res.data.data!;
  },
  adminCreate: async (dto: CreateGiftCardDto) => {
    const res = await apiClient.post<ApiResponse<GiftCard>>('/gift-cards', dto);
    return res.data.data!;
  },
  checkBalance: async (code: string) => {
    const res = await apiClient.post<ApiResponse<GiftCard>>('/gift-cards/balance', { code });
    return res.data.data!;
  },
};
