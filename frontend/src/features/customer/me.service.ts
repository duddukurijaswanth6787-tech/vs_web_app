import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export const customerMeService = {
  getProfile: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/me');
    return res.data.data!;
  },

  updateProfile: async (dto: Record<string, unknown>) => {
    const res = await apiClient.put<StandardResponse<any>>('/me', dto);
    return res.data.data!;
  },

  getAddresses: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/me/addresses');
    return res.data.data!;
  },

  createAddress: async (dto: Record<string, unknown>) => {
    const res = await apiClient.post<StandardResponse<any>>('/me/addresses', dto);
    return res.data.data!;
  },

  updateAddress: async (id: string, dto: Record<string, unknown>) => {
    const res = await apiClient.put<StandardResponse<any>>(`/me/addresses/${id}`, dto);
    return res.data.data!;
  },

  deleteAddress: async (id: string) => {
    await apiClient.delete(`/me/addresses/${id}`);
  },
};
