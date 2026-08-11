import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  OrderQueryDto,
  OrderListResponse,
  OrderResponse,
} from './order.types';

export const orderService = {
  findAll: async (query: OrderQueryDto = {}): Promise<OrderListResponse> => {
    const response = await apiClient.get<StandardResponse<OrderListResponse>>('/orders', { params: query });
    return response.data.data!;
  },

  findById: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.get<StandardResponse<OrderResponse>>(`/orders/${id}`);
    return response.data.data!;
  },

  findByOrderNumber: async (orderNumber: string): Promise<OrderResponse> => {
    const response = await apiClient.get<StandardResponse<OrderResponse>>(`/orders/number/${orderNumber}`);
    return response.data.data!;
  },

  updateStatus: async (id: string, status: string, message?: string): Promise<OrderResponse> => {
    const response = await apiClient.patch<StandardResponse<OrderResponse>>(`/orders/${id}/status`, { status, message });
    return response.data.data!;
  },
};
