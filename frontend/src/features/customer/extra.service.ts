import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export const customerSupportService = {
  contact: async (dto: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => {
    const res = await apiClient.post<StandardResponse<any>>('/support/contact', dto);
    return res.data.data!;
  },
};

export const customerSearchService = {
  search: async (q: string, params: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/search', {
      params: { q, ...params },
    });
    return res.data.data!;
  },

  autocomplete: async (q: string) => {
    const res = await apiClient.get<StandardResponse<any>>('/search/autocomplete', {
      params: { q },
    });
    return res.data.data!;
  },

  global: async (q: string) => {
    const res = await apiClient.get<StandardResponse<any>>('/search/global', {
      params: { q },
    });
    return res.data.data!;
  },
};

export const customerSocialService = {
  getFeed: async (params: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/social/feed', { params });
    return res.data.data!;
  },

  getReels: async (params: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/social/reels', { params });
    return res.data.data!;
  },
};

export const customerReferralService = {
  getOrCreateCode: async () => {
    const res = await apiClient.post<StandardResponse<any>>('/referral/code');
    return res.data.data!;
  },

  apply: async (code: string) => {
    const res = await apiClient.post<StandardResponse<any>>('/referral/apply', { code });
    return res.data.data!;
  },

  rewards: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/referral/rewards');
    return res.data.data!;
  },
};

export const customerNotificationService = {
  list: async (params: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/notifications', { params });
    return res.data.data!;
  },

  unreadCount: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/notifications/unread-count');
    return res.data.data!;
  },

  markRead: async (id: string) => {
    const res = await apiClient.patch<StandardResponse<any>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  markAllRead: async () => {
    const res = await apiClient.patch<StandardResponse<any>>('/notifications/read-all');
    return res.data.data!;
  },
};

export const customerPackingService = {
  getQueue: async (params: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/packing/queue', { params });
    return res.data.data!;
  },

  getJob: async (id: string) => {
    const res = await apiClient.get<StandardResponse<any>>(`/packing/jobs/${id}`);
    return res.data.data!;
  },

  start: async (id: string) => {
    const res = await apiClient.post<StandardResponse<any>>(`/packing/jobs/${id}/start`);
    return res.data.data!;
  },

  verifyBarcode: async (id: string, barcode: string) => {
    const res = await apiClient.post<StandardResponse<any>>(`/packing/jobs/${id}/verify-barcode`, {
      barcode,
    });
    return res.data.data!;
  },

  generateLabel: async (id: string) => {
    const res = await apiClient.post<StandardResponse<any>>(`/packing/jobs/${id}/label`);
    return res.data.data!;
  },

  complete: async (id: string) => {
    const res = await apiClient.post<StandardResponse<any>>(`/packing/jobs/${id}/complete`);
    return res.data.data!;
  },
};
