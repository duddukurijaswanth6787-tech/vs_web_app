import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recentlyViewedService } from './recently-viewed.service';

export const recentlyViewedKeys = {
  all: ['recently-viewed'] as const,
  list: (limit?: number) => [...recentlyViewedKeys.all, 'list', limit] as const,
};

export function useRecentlyViewed(limit = 10, enabled = true) {
  return useQuery({
    queryKey: recentlyViewedKeys.list(limit),
    queryFn: () => recentlyViewedService.list(limit),
    enabled,
  });
}

export function useTrackRecentlyViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => recentlyViewedService.track(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recentlyViewedKeys.all });
    },
  });
}

export function useClearRecentlyViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recentlyViewedService.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recentlyViewedKeys.all });
    },
  });
}
