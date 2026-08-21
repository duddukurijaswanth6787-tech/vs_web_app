import { apiClient } from '@/lib/api/client';
import { PopularSearch, PopularProductRecommendation, AiAnalyticsOverview } from './ai-analytics.types';

export const aiAnalyticsService = {
  getOverview: async (): Promise<AiAnalyticsOverview> => {
    const res = await apiClient.get<{ data: AiAnalyticsOverview }>('/ai/analytics');
    return res.data?.data || (res.data as unknown as AiAnalyticsOverview);
  },

  getPopularSearches: async (limit = 10): Promise<PopularSearch[]> => {
    const res = await apiClient.get<{ data: PopularSearch[] }>('/ai/analytics/popular-searches', { params: { limit } });
    return res.data?.data || (res.data as unknown as PopularSearch[]) || [];
  },

  getPopularProducts: async (limit = 10): Promise<PopularProductRecommendation[]> => {
    const res = await apiClient.get<{ data: PopularProductRecommendation[] }>('/ai/analytics/popular-products', { params: { limit } });
    return res.data?.data || (res.data as unknown as PopularProductRecommendation[]) || [];
  },
};
