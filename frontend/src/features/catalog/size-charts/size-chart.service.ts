import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  SizeChartQueryDto,
  SizeChartListResponse,
  SizeChartTemplateResponse,
  CreateSizeChartTemplateDto,
  UpdateSizeChartTemplateDto,
} from './size-chart.types';

export const sizeChartService = {
  findAll: async (query: SizeChartQueryDto = {}): Promise<SizeChartListResponse> => {
    const params: Record<string, string | number> = {};
    if (query.search) params.search = query.search;
    if (query.garmentType) params.garmentType = query.garmentType;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<SizeChartListResponse>>(
      '/size-charts',
      { params },
    );
    return response.data.data!;
  },

  findById: async (id: string): Promise<SizeChartTemplateResponse> => {
    const response = await apiClient.get<StandardResponse<SizeChartTemplateResponse>>(
      `/size-charts/${id}`,
    );
    return response.data.data!;
  },

  /** The chart attached to a product — null when none is set. */
  findByProductId: async (
    productId: string,
  ): Promise<SizeChartTemplateResponse | null> => {
    const response = await apiClient.get<StandardResponse<SizeChartTemplateResponse | null>>(
      `/size-charts/product/${productId}`,
    );
    return response.data.data ?? null;
  },

  create: async (
    dto: CreateSizeChartTemplateDto,
  ): Promise<SizeChartTemplateResponse> => {
    const response = await apiClient.post<StandardResponse<SizeChartTemplateResponse>>(
      '/size-charts',
      dto,
    );
    return response.data.data!;
  },

  update: async (
    id: string,
    dto: UpdateSizeChartTemplateDto,
  ): Promise<SizeChartTemplateResponse> => {
    const response = await apiClient.patch<StandardResponse<SizeChartTemplateResponse>>(
      `/size-charts/${id}`,
      dto,
    );
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/size-charts/${id}`);
  },
};
