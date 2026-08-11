import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import { getGuestId } from './guest';

export interface CartItemDto {
  id: string;
  cartId: string;
  productId: string;
  productName?: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  savedForLater: boolean;
  createdAt: string;
  imageUrl?: string;
}

export interface CartDto {
  id: string;
  customerId?: string;
  guestId?: string;
  status: string;
  items?: CartItemDto[];
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  createdAt: string;
}

function guestParams() {
  const guestId = getGuestId();
  return guestId ? { guestId } : {};
}

export const customerCartService = {
  getCart: async (): Promise<CartDto> => {
    const res = await apiClient.get<StandardResponse<CartDto>>('/cart', {
      params: guestParams(),
    });
    return res.data.data!;
  },

  getSummary: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/cart/summary', {
      params: guestParams(),
    });
    return res.data.data!;
  },

  addItem: async (dto: { productId: string; variantId?: string; quantity?: number }) => {
    const guestId = getGuestId();
    const res = await apiClient.post<StandardResponse<CartDto>>(
      '/cart/items',
      dto,
      { params: guestParams() },
    );
    return res.data.data!;
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const res = await apiClient.patch<StandardResponse<CartDto>>(
      `/cart/items/${itemId}`,
      { quantity },
      { params: guestParams() },
    );
    return res.data.data!;
  },

  removeItem: async (itemId: string) => {
    const res = await apiClient.delete<StandardResponse<CartDto>>(`/cart/items/${itemId}`, {
      params: guestParams(),
    });
    return res.data.data!;
  },

  clear: async () => {
    const res = await apiClient.delete<StandardResponse<CartDto>>('/cart', {
      params: guestParams(),
    });
    return res.data.data!;
  },

  merge: async () => {
    const guestId = getGuestId();
    if (!guestId) return null;
    const res = await apiClient.post<StandardResponse<CartDto>>('/cart/merge', { guestId });
    return res.data.data!;
  },
};
