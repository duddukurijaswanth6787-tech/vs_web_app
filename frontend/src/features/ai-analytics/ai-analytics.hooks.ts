import { useQuery } from '@tanstack/react-query';
import { aiAnalyticsService } from './ai-analytics.service';

export const aiAnalyticsKeys = {
  all: ['ai-analytics'] as const,
  overview: () => [...aiAnalyticsKeys.all, 'overview'] as const,
  popularSearches: (limit?: number) => [...aiAnalyticsKeys.all, 'popular-searches', limit] as const,
  popularProducts: (limit?: number) => [...aiAnalyticsKeys.all, 'popular-products', limit] as const,
};

export function useAiAnalyticsOverview() {
  return useQuery({
    queryKey: aiAnalyticsKeys.overview(),
    queryFn: () => aiAnalyticsService.getOverview(),
  });
}

export function usePopularSearches(limit = 10) {
  return useQuery({
    queryKey: aiAnalyticsKeys.popularSearches(limit),
    queryFn: () => aiAnalyticsService.getPopularSearches(limit),
  });
}

export function usePopularProductRecommendations(limit = 10) {
  return useQuery({
    queryKey: aiAnalyticsKeys.popularProducts(limit),
    queryFn: () => aiAnalyticsService.getPopularProducts(limit),
  });
}
