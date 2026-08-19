import { apiClient } from '@/lib/api/client';
import { RagAnalyticsSummary, SocialAnalyticsSummary, RagIntentCount, SocialEngagementTimelinePoint } from './analytics.types';
import { StandardResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const analyticsService = {
  async getRagSummary(): Promise<RagAnalyticsSummary> {
    const res = await apiClient.get<ApiResponse<RagAnalyticsSummary>>('/admin/rag/analytics/summary');
    return res.data.data!;
  },

  async getRagIntents(): Promise<RagIntentCount[]> {
    const res = await apiClient.get<ApiResponse<RagIntentCount[]>>('/admin/rag/analytics/intents');
    return res.data.data!;
  },

  async getSocialSummary(): Promise<SocialAnalyticsSummary> {
    const res = await apiClient.get<ApiResponse<SocialAnalyticsSummary>>('/admin/social/analytics/summary');
    return res.data.data!;
  },

  async getSocialEngagementTimeline(days = 14): Promise<SocialEngagementTimelinePoint[]> {
    const res = await apiClient.get<ApiResponse<SocialEngagementTimelinePoint[]>>('/admin/social/analytics/timeline', {
      params: { days },
    });
    return res.data.data!;
  },
};
