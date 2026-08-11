import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export const customerOrdersService = {
  list: async (query: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/me/orders', { params: query });
    return res.data.data!;
  },

  getByNumber: async (orderNumber: string) => {
    const res = await apiClient.get<StandardResponse<any>>(`/me/orders/${orderNumber}`);
    return res.data.data!;
  },

  tracking: async (orderNumber: string) => {
    const res = await apiClient.get<StandardResponse<any>>(
      `/me/orders/${orderNumber}/tracking`,
    );
    return res.data.data!;
  },

  invoice: async (orderNumber: string) => {
    const res = await apiClient.get<StandardResponse<any>>(
      `/me/orders/${orderNumber}/invoice`,
    );
    return res.data.data!;
  },

  cancel: async (orderNumber: string, reason: string) => {
    const res = await apiClient.post<StandardResponse<any>>(
      `/me/orders/${orderNumber}/cancel`,
      { reason },
    );
    return res.data.data!;
  },

  createReturn: async (dto: Record<string, unknown>) => {
    const res = await apiClient.post<StandardResponse<any>>('/returns', dto);
    return res.data.data!;
  },

  myReturns: async (query: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/me/returns', { params: query });
    return res.data.data!;
  },

  getReturn: async (returnId: string) => {
    const res = await apiClient.get<StandardResponse<any>>(`/me/returns/${returnId}`);
    return res.data.data!;
  },

  cancelReturn: async (returnId: string) => {
    const res = await apiClient.patch<StandardResponse<any>>(`/me/returns/${returnId}/cancel`);
    return res.data.data!;
  },

  createReview: async (productId: string, dto: Record<string, unknown>) => {
    const res = await apiClient.post<StandardResponse<any>>(
      `/products/${productId}/reviews`,
      dto,
    );
    return res.data.data!;
  },
};
