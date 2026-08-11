import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

const GUEST_WISHLIST_KEY = 'vd_guest_wishlist';

const hasToken = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('vd_access_token');
};

const getGuestWishlist = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save guest wishlist:', err);
  }
};

export const customerWishlistService = {
  getWishlist: async () => {
    if (!hasToken()) return { items: getGuestWishlist() };
    try {
      const res = await apiClient.get<StandardResponse<any>>('/wishlist');
      return res.data.data || { items: [] };
    } catch (err: any) {
      if (err?.response?.status === 401) return { items: getGuestWishlist() };
      throw err;
    }
  },

  getItems: async (page = 1, limit = 50) => {
    if (!hasToken()) {
      const items = getGuestWishlist();
      return { items, total: items.length };
    }
    try {
      const res = await apiClient.get<StandardResponse<any>>('/wishlist/items', {
        params: { page, limit },
      });
      return res.data.data || { items: [] };
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const items = getGuestWishlist();
        return { items, total: items.length };
      }
      throw err;
    }
  },

  getCount: async () => {
    if (!hasToken()) return { count: getGuestWishlist().length };
    try {
      const res = await apiClient.get<StandardResponse<{ count: number }>>('/wishlist/count');
      return res.data.data || { count: 0 };
    } catch (err: any) {
      if (err?.response?.status === 401) return { count: getGuestWishlist().length };
      return { count: 0 };
    }
  },

  isInWishlist: async (productId: string) => {
    if (!hasToken()) {
      const items = getGuestWishlist();
      return { inWishlist: items.some((item) => item.productId === productId || item.id === productId) };
    }
    try {
      const res = await apiClient.get<StandardResponse<{ inWishlist: boolean }>>(
        `/wishlist/check/${productId}`,
      );
      return res.data.data!;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const items = getGuestWishlist();
        return { inWishlist: items.some((item) => item.productId === productId || item.id === productId) };
      }
      return { inWishlist: false };
    }
  },

  addItem: async (productId: string, variantId?: string) => {
    if (!hasToken()) {
      const items = getGuestWishlist();
      const exists = items.some((item) => item.productId === productId);
      if (!exists) {
        const newItem = {
          id: `guest-${productId}`,
          productId,
          variantId: variantId || null,
          createdAt: new Date().toISOString(),
        };
        items.push(newItem);
        saveGuestWishlist(items);
        return newItem;
      }
      return items.find((item) => item.productId === productId);
    }
    try {
      const res = await apiClient.post<StandardResponse<any>>('/wishlist/items', {
        productId,
        variantId,
      });
      return res.data.data!;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const items = getGuestWishlist();
        const exists = items.some((item) => item.productId === productId);
        if (!exists) {
          const newItem = {
            id: `guest-${productId}`,
            productId,
            variantId: variantId || null,
            createdAt: new Date().toISOString(),
          };
          items.push(newItem);
          saveGuestWishlist(items);
          return newItem;
        }
        return items.find((item) => item.productId === productId);
      }
      throw err;
    }
  },

  removeItem: async (productId: string) => {
    if (!hasToken()) {
      const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
      saveGuestWishlist(items);
      return;
    }
    try {
      await apiClient.delete(`/wishlist/items/${productId}`);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
        saveGuestWishlist(items);
        return;
      }
      throw err;
    }
  },

  moveToCart: async (productId: string) => {
    if (!hasToken()) {
      const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
      saveGuestWishlist(items);
      return { success: true };
    }
    try {
      const res = await apiClient.post<StandardResponse<any>>(
        `/wishlist/items/${productId}/move-to-cart`,
      );
      return res.data.data!;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const items = getGuestWishlist().filter((item) => item.productId !== productId && item.id !== productId);
        saveGuestWishlist(items);
        return { success: true };
      }
      throw err;
    }
  },

  syncGuestWishlist: async () => {
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
