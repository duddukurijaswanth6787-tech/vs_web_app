import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import { getGuestId, getStoredGuestId, clearGuestId } from './guest';

export interface CartItemDto {
  id: string;
  cartId: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  savedForLater: boolean;
  createdAt: string;
  imageUrl?: string;
  color?: string;
  size?: string;
  product?: {
    slug?: string;
    primaryImageUrl?: string;
    images?: Array<{ url?: string }>;
  };
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

export interface CartSummaryDto {
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  shippingTotal?: number;
  grandTotal?: number;
}

function guestParams() {
  const guestId = getGuestId();
  return guestId ? { guestId } : {};
}

let guestCartMerge: { guestId: string; promise: Promise<CartDto | null> } | null = null;

export const customerCartService = {
  getCart: async (): Promise<CartDto> => {
    const res = await apiClient.get<StandardResponse<CartDto>>('/cart', {
      params: guestParams(),
    });
    return res.data.data!;
  },

  getSummary: async (): Promise<CartSummaryDto> => {
    const res = await apiClient.get<StandardResponse<CartSummaryDto>>('/cart/summary', {
      params: guestParams(),
    });
    return res.data.data!;
  },

  addItem: async (dto: { productId: string; variantId?: string; quantity?: number }) => {
    const res = await apiClient.post<StandardResponse<CartDto>>(
      '/cart/items',
      dto,
      { params: guestParams() },
    );
    return res.data.data!;
  },

  // Buy Now describes the quantity selected on the product page. Reusing a
  // line already in the bag must not add that quantity to it a second time.
  buyNow: async (
    dto: { productId: string; variantId?: string; quantity?: number },
    mergeGuestCart = false,
  ): Promise<CartDto> => {
    if (mergeGuestCart) {
      const guestId = getStoredGuestId();
      const merged = await customerCartService.merge();
      if (guestId && !merged && getStoredGuestId() === guestId) {
        throw new Error('Could not transfer your bag. Please try again.');
      }
    }

    let cart = await customerCartService.getCart();
    const quantity = dto.quantity ?? 1;
    const existing = cart.items?.find(
      (item) => item.productId === dto.productId &&
        (item.variantId || '') === (dto.variantId || ''),
    );
    if (!existing) return customerCartService.addItem({ ...dto, quantity });

    if (existing.savedForLater) {
      const res = await apiClient.post<StandardResponse<CartDto>>(
        `/cart/items/${existing.id}/move-to-cart`,
        {},
        { params: guestParams() },
      );
      cart = res.data.data!;
    }
    if (existing.quantity === quantity) return cart;
    return customerCartService.updateQuantity(existing.id, quantity);
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

  merge: (): Promise<CartDto | null> => {
    const guestId = getStoredGuestId();
    if (!guestId) return Promise.resolve(null);
    // Login, AuthContext and checkout can all request a merge before the
    // first request completes. They must share it rather than transfer the
    // same guest quantities several times.
    if (guestCartMerge?.guestId === guestId) return guestCartMerge.promise;

    const promise: Promise<CartDto | null> = apiClient
      .post<StandardResponse<CartDto>>('/cart/merge', { guestId })
      .then((res) => {
        if (getStoredGuestId() === guestId) clearGuestId();
        return res.data.data!;
      })
      .catch(() => null)
      .finally(() => {
        if (guestCartMerge?.promise === promise) guestCartMerge = null;
      });
    guestCartMerge = { guestId, promise };
    return promise;
  },
};
