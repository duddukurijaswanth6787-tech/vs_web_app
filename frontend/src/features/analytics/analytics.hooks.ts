import { useQuery } from '@tanstack/react-query';
import { analyticsService } from './analytics.service';
import { AnalyticsPeriod } from './analytics.types';

export function useOmnichannelAnalytics(period: AnalyticsPeriod = 'monthly') {
  return useQuery({
    queryKey: ['analytics-omnichannel', period],
    queryFn: () => analyticsService.getOmnichannel(period),
    staleTime: 60 * 1000,
  });
}

export function useOfflinePosAnalytics(period: AnalyticsPeriod = 'monthly') {
  return useQuery({
    queryKey: ['analytics-offline-pos', period],
    queryFn: () => analyticsService.getOfflinePos(period),
    staleTime: 60 * 1000,
  });
}

export function useOnlineSalesAnalytics(period: AnalyticsPeriod = 'monthly') {
  return useQuery({
    queryKey: ['analytics-online-sales', period],
    queryFn: () => analyticsService.getOnlineSales(period),
    staleTime: 60 * 1000,
  });
}

export function useInventoryVelocityAnalytics() {
  return useQuery({
    queryKey: ['analytics-inventory-velocity'],
    queryFn: () => analyticsService.getInventoryVelocity(),
    staleTime: 60 * 1000,
  });
}

export function useSocialAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-social-summary'],
    queryFn: async () => ({
      totalPosts: 12,
      totalLikes: 1420,
      totalComments: 310,
      totalSaves: 180,
      totalShares: 95,
      totalViews: 8900,
      totalPlays: 4500,
      topPosts: [] as Array<{
        id: string;
        caption?: string;
        contentType?: string;
        likeCount?: number;
        commentCount?: number;
        shareCount?: number;
        viewCount?: number;
        playCount?: number;
        saveCount?: number;
      }>,
    }),
    staleTime: 60 * 1000,
  });
}

export function useSocialEngagementTimeline(days = 14) {
  return useQuery({
    queryKey: ['analytics-social-timeline', days],
    queryFn: async () => [],
    staleTime: 60 * 1000,
  });
}
