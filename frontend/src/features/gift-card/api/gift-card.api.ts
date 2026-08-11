import { apiClient } from '@/lib/api/client';

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  expiryDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REDEEMED';
  createdAt: string;
}

export interface CreateGiftCardDto {
  code?: string;
  initialBalance: number;
  expiryDate?: string;
}

export const giftCardApi = {
  adminList: async (page = 1, limit = 20) => {
    const res = await apiClient.get<GiftCard[]>(`/gift-cards?page=${page}&limit=${limit}`);
    return res.data;
  },
  adminCreate: async (dto: CreateGiftCardDto) => {
    const res = await apiClient.post<GiftCard>('/gift-cards', dto);
    return res.data;
  },
  checkBalance: async (code: string) => {
    const res = await apiClient.post<{ balance: number }>('/gift-cards/balance', { code });
    return res.data;
  },
};
