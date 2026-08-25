import { apiClient, hasClientAccessToken } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import axios from 'axios';

const GUEST_WISHLIST_KEY = 'vd_guest_wishlist';

export interface WishlistItemDto {
  id: string;
  productId: string;
  variantId?: string | null;
  product?: Record<string, unknown>;
  createdAt?: string;
  [key: string]: unknown;
}

export interface WishlistDto {
  id?: string;
  items: WishlistItemDto[];
  data?: WishlistItemDto[];
  total?: number;
  [key: string]: unknown;
}

// localStorage('vd_access_token') is never written any more -- the access
// token is memory-only and the refresh token is an httpOnly cookie. Reading
// the old key made every signed-in customer look like a guest here.
const hasToken = () => hasClientAccessToken();

const getGuestWishlist = (): WishlistItemDto[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items: WishlistItemDto[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save guest wishlist:', err);
  }
};

const getErrorStatus = (err: unknown): number | undefined => {
  if (axios.isAxiosError(err)) {
    return err.response?.status;
  }
  return (err as { response?: { status?: number } })?.response?.status;
};

export const customerWishlistService = {
  getWishlist: async (): Promise<WishlistDto> => {
    if (!hasToken()) return { items: getGuestWishlist() };
    try {
      const res = await apiClient.get<StandardResponse<WishlistDto>>('/wishlist');
      return res.data.data || { items: [] };
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 401 || status === 400) return { items: getGuestWishlist() };
      return { items: getGuestWishlist() };
    }
  },

  getItems: async (page = 1, limit = 50): Promise<{ items: WishlistItemDto[]; total: number }> => {
    if (!hasToken()) {
      const items = getGuestWishlist();
      return { items, total: items.length };
    }
    try {
      const res = await apiClient.get<StandardResponse<{ items: WishlistItemDto[]; total?: number }>>('/wishlist/items', {
        params: { page, limit },
      });
      const data = res.data.data;
      return {
        items: data?.items || [],
        total: data?.total ?? (data?.items?.length || 0),
      };
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 401 || status === 400) {
        const items = getGuestWishlist();
        return { items, total: items.length };
      }
      const items = getGuestWishlist();
      return { items, total: items.length };
    }
  },

  getCount: async (): Promise<{ count: number }> => {
    if (!hasToken()) return { count: getGuestWishlist().length };
    try {
      const res = await apiClient.get<StandardResponse<{ count: number }>>('/wishlist/count');
      return res.data.data || { count: 0 };
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 401 || status === 400) return { count: getGuestWishlist().length };
      return { count: getGuestWishlist().length };
    }
  },

  isInWishlist: async (productId: string): Promise<{ inWishlist: boolean }> => {
    if (!hasToken()) {
      const items = getGuestWishlist();
      return { inWishlist: items.some((item) => item.productId === productId || item.id === productId) };
    }
    try {
      const res = await apiClient.get<StandardResponse<{ inWishlist: boolean }>>(
        `/wishlist/check/${productId}`,
      );
      return res.data.data!;
    } catch (err: unknown) {
      const items = getGuestWishlist();
      return { inWishlist: items.some((item) => item.productId === productId || item.id === productId) };
    }
  },

  addItem: async (productId: string, variantId?: string): Promise<WishlistItemDto> => {
    if (!hasToken()) {
      const items = getGuestWishlist();
      const exists = items.find((item) => item.productId === productId);
      if (!exists) {
        const newItem: WishlistItemDto = {
          id: `guest-${productId}`,
          productId,
          variantId: variantId || null,
          createdAt: new Date().toISOString(),
        };
        items.push(newItem);
        saveGuestWishlist(items);
        return newItem;
      }
      return exists;
    }
    try {
      const res = await apiClient.post<StandardResponse<WishlistItemDto>>('/wishlist/items', {
        productId,
        variantId,
      });
      return res.data.data!;
    } catch (err: unknown) {
      if (getErrorStatus(err) === 401) {
        const items = getGuestWishlist();
        const exists = items.find((item) => item.productId === productId);
        if (!exists) {
          const newItem: WishlistItemDto = {
            id: `guest-${productId}`,
            productId,
            variantId: variantId || null,
            createdAt: new Date().toISOString(),
          };
          items.push(newItem);
          saveGuestWishlist(items);
          return newItem;
        }
        return exists;
      }
      throw err;
    }
  },

  removeItem: async (productId: string): Promise<void> => {
    if (!hasToken()) {
      const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
      saveGuestWishlist(items);
      return;
    }
    try {
      await apiClient.delete(`/wishlist/items/${productId}`);
    } catch (err: unknown) {
      if (getErrorStatus(err) === 401) {
        const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
        saveGuestWishlist(items);
        return;
      }
      throw err;
    }
  },

  moveToCart: async (productId: string): Promise<{ success: boolean }> => {
    if (!hasToken()) {
      const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
      saveGuestWishlist(items);
      return { success: true };
    }
    try {
      const res = await apiClient.post<StandardResponse<{ success: boolean }>>(
        `/wishlist/items/${productId}/move-to-cart`,
      );
      return res.data.data!;
    } catch (err: unknown) {
      if (getErrorStatus(err) === 401) {
        const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
        saveGuestWishlist(items);
        return { success: true };
      }
      throw err;
    }
  },

  syncGuestWishlist: async (): Promise<void> => {
    if (!hasToken()) return;
    const items = getGuestWishlist();
    if (items.length === 0) return;
    const productIds = items.map((i) => i.productId).filter(Boolean);
    if (productIds.length === 0) return;

    try {
      await apiClient.post('/wishlist/sync', { productIds });
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_WISHLIST_KEY);
      }
    } catch (err) {
      console.error('Failed to sync guest wishlist:', err);
    }
  },
};
