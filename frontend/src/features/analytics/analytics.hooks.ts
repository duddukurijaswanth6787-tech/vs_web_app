import { useQuery } from '@tanstack/react-query';
import { analyticsService } from './analytics.service';

export function useRagAnalyticsSummary() {
  return useQuery({
    queryKey: ['rag-analytics-summary'],
    queryFn: () => analyticsService.getRagSummary(),
  });
}

export function useRagIntents() {
  return useQuery({
    queryKey: ['rag-intents'],
    queryFn: () => analyticsService.getRagIntents(),
  });
}

export function useSocialAnalyticsSummary() {
  return useQuery({
    queryKey: ['social-analytics-summary'],
    queryFn: () => analyticsService.getSocialSummary(),
  });
}

export function useSocialEngagementTimeline(days = 14) {
  return useQuery({
    queryKey: ['social-engagement-timeline', days],
    queryFn: () => analyticsService.getSocialEngagementTimeline(days),
  });
}
