import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sizeChartService } from './size-chart.service';
import {
  SizeChartQueryDto,
  CreateSizeChartTemplateDto,
  UpdateSizeChartTemplateDto,
} from './size-chart.types';

export const sizeChartKeys = {
  all: ['size-charts'] as const,
  lists: () => [...sizeChartKeys.all, 'list'] as const,
  list: (query: SizeChartQueryDto) => [...sizeChartKeys.lists(), query] as const,
  details: () => [...sizeChartKeys.all, 'detail'] as const,
  detail: (id: string) => [...sizeChartKeys.details(), id] as const,
  byProduct: (productId: string) =>
    [...sizeChartKeys.all, 'product', productId] as const,
};

export function useSizeCharts(query: SizeChartQueryDto = {}) {
  return useQuery({
    queryKey: sizeChartKeys.list(query),
    queryFn: () => sizeChartService.findAll(query),
  });
}

export function useSizeChart(id: string, enabled = true) {
  return useQuery({
    queryKey: sizeChartKeys.detail(id),
    queryFn: () => sizeChartService.findById(id),
    enabled: enabled && Boolean(id),
  });
}

export function useProductSizeChart(productId: string, enabled = true) {
  return useQuery({
    queryKey: sizeChartKeys.byProduct(productId),
    queryFn: () => sizeChartService.findByProductId(productId),
    enabled: enabled && Boolean(productId),
  });
}

export function useCreateSizeChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSizeChartTemplateDto) => sizeChartService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeChartKeys.lists() });
    },
  });
}

export function useUpdateSizeChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSizeChartTemplateDto }) =>
      sizeChartService.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: sizeChartKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sizeChartKeys.detail(variables.id) });
    },
  });
}

export function useDeleteSizeChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sizeChartService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeChartKeys.lists() });
    },
  });
}
