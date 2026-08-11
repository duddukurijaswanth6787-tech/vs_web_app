import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  PaymentQueryDto,
  PaymentListResponse,
  PaymentResponse,
  CreatePaymentDto,
  VerifyPaymentDto,
} from './payment.types';

export const paymentService = {
  findAll: async (query: PaymentQueryDto = {}): Promise<PaymentListResponse> => {
    const response = await apiClient.get<StandardResponse<PaymentListResponse>>('/payments', { params: query });
    return response.data.data!;
  },

  findByOrderId: async (orderId: string): Promise<PaymentResponse[]> => {
    const response = await apiClient.get<StandardResponse<PaymentResponse[]>>(`/payments/order/${orderId}`);
    return response.data.data!;
  },

  findById: async (id: string): Promise<PaymentResponse> => {
    const response = await apiClient.get<StandardResponse<PaymentResponse>>(`/payments/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreatePaymentDto): Promise<PaymentResponse> => {
    const response = await apiClient.post<StandardResponse<PaymentResponse>>('/payments', dto);
    return response.data.data!;
  },

  updateStatus: async (id: string, status: string): Promise<PaymentResponse> => {
    const response = await apiClient.patch<StandardResponse<PaymentResponse>>(`/payments/${id}/status`, { status });
    return response.data.data!;
  },

  verify: async (id: string, dto: VerifyPaymentDto): Promise<PaymentResponse> => {
    const response = await apiClient.post<StandardResponse<PaymentResponse>>(`/payments/${id}/verify`, dto);
    return response.data.data!;
  },
};
