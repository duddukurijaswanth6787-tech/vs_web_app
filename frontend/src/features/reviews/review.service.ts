import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  ReviewListResponse,
  ReviewResponse,
  ReviewQueryDto,
  ProductRatingSummary,
} from './review.types';

export const reviewService = {
  findAll: async (query: ReviewQueryDto = {}): Promise<ReviewListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.productId && typeof query.productId === 'string' && query.productId.trim()) {
      params.productId = query.productId.trim();
    }
    if (query.customerId && typeof query.customerId === 'string' && query.customerId.trim()) {
      params.customerId = query.customerId.trim();
    }
    if (query.rating !== undefined && query.rating !== null && !isNaN(Number(query.rating))) {
      params.rating = Number(query.rating);
    }
    if (query.status && typeof query.status === 'string' && query.status.trim()) {
      params.status = query.status.trim();
    }
    if (query.page && !isNaN(Number(query.page))) {
      params.page = Number(query.page);
    }
    if (query.limit && !isNaN(Number(query.limit))) {
      params.limit = Number(query.limit);
    }

    try {
      const response = await apiClient.get<any>('/reviews', { params });
      const raw = response.data?.data ?? response.data;
      if (Array.isArray(raw)) {
        return {
          data: raw,
          meta: {
            page: 1,
            limit: raw.length,
            total: raw.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }
      return {
        data: Array.isArray(raw?.data) ? raw.data : [],
        meta: raw?.meta || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };
    } catch {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }
  },

  getProductRatingSummary: async (productId: string): Promise<ProductRatingSummary> => {
    const response = await apiClient.get<StandardResponse<ProductRatingSummary>>(`/reviews/product/${productId}/summary`);
    return response.data.data!;
  },

  findById: async (id: string): Promise<ReviewResponse> => {
    const response = await apiClient.get<StandardResponse<ReviewResponse>>(`/reviews/${id}`);
    return response.data.data!;
  },

  approve: async (id: string): Promise<ReviewResponse> => {
    const response = await apiClient.post<StandardResponse<ReviewResponse>>(`/reviews/${id}/approve`);
    return response.data.data!;
  },

  reject: async (id: string): Promise<ReviewResponse> => {
    const response = await apiClient.post<StandardResponse<ReviewResponse>>(`/reviews/${id}/reject`);
    return response.data.data!;
  },
};
