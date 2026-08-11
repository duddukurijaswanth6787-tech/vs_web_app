import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bannerService } from './banner.service';
import { BannerQueryDto, CreateBannerDto, UpdateBannerDto } from './banner.types';

export const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (query: BannerQueryDto) => [...bannerKeys.lists(), query] as const,
  details: () => [...bannerKeys.all, 'detail'] as const,
  detail: (id: string) => [...bannerKeys.details(), id] as const,
};

export function useBanners(query: BannerQueryDto = {}) {
  return useQuery({
    queryKey: bannerKeys.list(query),
    queryFn: () => bannerService.findBanners(query),
  });
}

export function useBanner(id: string, enabled = true) {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => bannerService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBannerDto) => bannerService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBannerDto }) =>
      bannerService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bannerKeys.detail(data.id) });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bannerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}
