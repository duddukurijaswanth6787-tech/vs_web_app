import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface ContactResultDto {
  success: boolean;
  message?: string;
  ticketId?: string;
}

export interface SearchResultDto {
  products: Array<Record<string, unknown>>;
  categories?: Array<Record<string, unknown>>;
  total: number;
}

export interface AutocompleteResultDto {
  suggestions: string[];
  products?: Array<{ id: string; title: string }>;
}

export interface SocialFeedDto {
  posts: Array<Record<string, unknown>>;
  total?: number;
}

export interface ReferralCodeDto {
  code: string;
  shareUrl?: string;
}

export interface ReferralRewardDto {
  rewards: Array<Record<string, unknown>>;
  totalEarned?: number;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface PackingJobDto {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  items: Array<{ id: string; barcode?: string; quantity: number; verified?: boolean }>;
  data?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export const customerSupportService = {
  contact: async (dto: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<ContactResultDto> => {
    const res = await apiClient.post<StandardResponse<ContactResultDto>>('/support/contact', dto);
    return res.data.data!;
  },
};

export const customerSearchService = {
  search: async (q: string, params: Record<string, string | number> = {}): Promise<SearchResultDto> => {
    const res = await apiClient.get<StandardResponse<SearchResultDto>>('/search', {
      params: { q, ...params },
    });
    return res.data.data!;
  },

  autocomplete: async (q: string): Promise<AutocompleteResultDto> => {
    const res = await apiClient.get<StandardResponse<AutocompleteResultDto>>('/search/autocomplete', {
      params: { q },
    });
    return res.data.data!;
  },

  global: async (q: string): Promise<SearchResultDto> => {
    const res = await apiClient.get<StandardResponse<SearchResultDto>>('/search/global', {
      params: { q },
    });
    return res.data.data!;
  },
};

export const customerSocialService = {
  getFeed: async (params: Record<string, string | number> = {}): Promise<SocialFeedDto> => {
    const res = await apiClient.get<StandardResponse<SocialFeedDto>>('/social/feed', { params });
    return res.data.data!;
  },

  getReels: async (params: Record<string, string | number> = {}): Promise<SocialFeedDto> => {
    const res = await apiClient.get<StandardResponse<SocialFeedDto>>('/social/reels', { params });
    return res.data.data!;
  },
};

export const customerReferralService = {
  getOrCreateCode: async (): Promise<ReferralCodeDto> => {
    const res = await apiClient.post<StandardResponse<ReferralCodeDto>>('/referral/code');
    return res.data.data!;
  },

  apply: async (code: string): Promise<{ applied: boolean; discountAmount?: number }> => {
    const res = await apiClient.post<StandardResponse<{ applied: boolean; discountAmount?: number }>>('/referral/apply', { code });
    return res.data.data!;
  },

  rewards: async (): Promise<ReferralRewardDto> => {
    const res = await apiClient.get<StandardResponse<ReferralRewardDto>>('/referral/rewards');
    return res.data.data!;
  },
};

export const customerNotificationService = {
  list: async (params: Record<string, string | number> = {}): Promise<{ notifications: NotificationDto[]; total: number }> => {
    const res = await apiClient.get<StandardResponse<{ notifications: NotificationDto[]; total: number }>>('/notifications', { params });
    return res.data.data!;
  },

  unreadCount: async (): Promise<{ count: number }> => {
    const res = await apiClient.get<StandardResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data!;
  },

  markRead: async (id: string): Promise<NotificationDto> => {
    const res = await apiClient.patch<StandardResponse<NotificationDto>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  markAllRead: async (): Promise<{ success: boolean }> => {
    const res = await apiClient.patch<StandardResponse<{ success: boolean }>>('/notifications/read-all');
    return res.data.data!;
  },
};

export const customerPackingService = {
  getQueue: async (params: Record<string, string | number> = {}): Promise<{ jobs?: PackingJobDto[]; data?: PackingJobDto[]; total: number }> => {
    const res = await apiClient.get<StandardResponse<{ jobs?: PackingJobDto[]; data?: PackingJobDto[]; total: number }>>('/packing/queue', { params });
    return res.data.data!;
  },

  getJob: async (id: string): Promise<PackingJobDto> => {
    const res = await apiClient.get<StandardResponse<PackingJobDto>>(`/packing/jobs/${id}`);
    return res.data.data!;
  },

  start: async (id: string): Promise<PackingJobDto> => {
    const res = await apiClient.post<StandardResponse<PackingJobDto>>(`/packing/jobs/${id}/start`);
    return res.data.data!;
  },

  verifyBarcode: async (id: string, barcode: string): Promise<{ verified: boolean; job: PackingJobDto }> => {
    const res = await apiClient.post<StandardResponse<{ verified: boolean; job: PackingJobDto }>>(`/packing/jobs/${id}/verify-barcode`, {
      barcode,
    });
    return res.data.data!;
  },

  generateLabel: async (id: string): Promise<{ labelUrl: string }> => {
    const res = await apiClient.post<StandardResponse<{ labelUrl: string }>>(`/packing/jobs/${id}/label`);
    return res.data.data!;
  },

  complete: async (id: string): Promise<PackingJobDto> => {
    const res = await apiClient.post<StandardResponse<PackingJobDto>>(`/packing/jobs/${id}/complete`);
    return res.data.data!;
  },
};
