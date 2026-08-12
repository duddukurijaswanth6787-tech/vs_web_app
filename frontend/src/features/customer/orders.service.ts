import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingFee?: number;
  discountAmount?: number;
  createdAt: string;
  items?: OrderItemDto[];
  shippingAddress?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OrderTrackingDto {
  orderNumber: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  status: string;
  history?: Array<{ status: string; timestamp: string; location?: string }>;
  [key: string]: unknown;
}

export interface ReturnRequestDto {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  status: string;
  createdAt: string;
  items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type OrderListResult = OrderDto[] & { orders?: OrderDto[]; data?: OrderDto[]; items?: OrderDto[]; total?: number };

export const customerOrdersService = {
  list: async (query: Record<string, string | number> = {}): Promise<OrderListResult> => {
    const res = await apiClient.get<StandardResponse<OrderListResult>>('/me/orders', { params: query });
    return res.data.data!;
  },

  getByNumber: async (orderNumber: string): Promise<OrderDto> => {
    const res = await apiClient.get<StandardResponse<OrderDto>>(`/me/orders/${orderNumber}`);
    return res.data.data!;
  },

  tracking: async (orderNumber: string): Promise<OrderTrackingDto> => {
    const res = await apiClient.get<StandardResponse<OrderTrackingDto>>(
      `/me/orders/${orderNumber}/tracking`,
    );
    return res.data.data!;
  },

  invoice: async (orderNumber: string): Promise<{ invoiceUrl?: string; pdfUrl?: string; orderNumber: string }> => {
    const res = await apiClient.get<StandardResponse<{ invoiceUrl?: string; pdfUrl?: string; orderNumber: string }>>(
      `/me/orders/${orderNumber}/invoice`,
    );
    return res.data.data!;
  },

  cancel: async (orderNumber: string, reason: string): Promise<OrderDto> => {
    const res = await apiClient.post<StandardResponse<OrderDto>>(
      `/me/orders/${orderNumber}/cancel`,
      { reason },
    );
    return res.data.data!;
  },

  createReturn: async (dto: Record<string, unknown>): Promise<ReturnRequestDto> => {
    const res = await apiClient.post<StandardResponse<ReturnRequestDto>>('/returns', dto);
    return res.data.data!;
  },

  myReturns: async (query: Record<string, string | number> = {}): Promise<{ returns: ReturnRequestDto[]; total?: number } | ReturnRequestDto[]> => {
    const res = await apiClient.get<StandardResponse<{ returns: ReturnRequestDto[]; total?: number } | ReturnRequestDto[]>>('/me/returns', { params: query });
    return res.data.data!;
  },

  getReturn: async (returnId: string): Promise<ReturnRequestDto> => {
    const res = await apiClient.get<StandardResponse<ReturnRequestDto>>(`/me/returns/${returnId}`);
    return res.data.data!;
  },

  cancelReturn: async (returnId: string): Promise<ReturnRequestDto> => {
    const res = await apiClient.patch<StandardResponse<ReturnRequestDto>>(`/me/returns/${returnId}/cancel`);
    return res.data.data!;
  },

  createReview: async (productId: string, dto: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const res = await apiClient.post<StandardResponse<Record<string, unknown>>>(
      `/products/${productId}/reviews`,
      dto,
    );
    return res.data.data!;
  },
};
