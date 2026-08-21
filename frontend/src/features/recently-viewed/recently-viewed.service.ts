import { apiClient } from '@/lib/api/client';
import { RecentlyViewedItem } from './recently-viewed.types';

export const recentlyViewedService = {
  track: async (productId: string): Promise<RecentlyViewedItem> => {
    const res = await apiClient.post<{ data: RecentlyViewedItem }>('/recently-viewed', { productId });
    return res.data?.data || (res.data as unknown as RecentlyViewedItem);
  },

  list: async (limit = 10): Promise<RecentlyViewedItem[]> => {
    const res = await apiClient.get<{ data: RecentlyViewedItem[] }>('/recently-viewed', { params: { limit } });
    return res.data?.data || (res.data as unknown as RecentlyViewedItem[]) || [];
  },

  clear: async (): Promise<void> => {
    await apiClient.delete('/recently-viewed');
  },
};
