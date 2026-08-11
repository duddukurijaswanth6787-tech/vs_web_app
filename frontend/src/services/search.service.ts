import { apiClient } from '@/lib/api/client';

export interface GlobalSearchResult {
  products: Array<{ id: string; name: string; sku: string; slug: string; basePrice: number }>;
  orders: Array<{ id: string; orderNumber: string; status: string; grandTotal: number; currency: string }>;
  customers: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  coupons: Array<{ id: string; code: string; name: string; type: string }>;
}

export interface AutocompleteResult {
  products: Array<{ id: string; name: string; slug: string; basePrice: number }>;
  suggestions: string[];
}

export const searchService = {
  globalSearch: async (q: string, limit = 10): Promise<GlobalSearchResult> => {
    const response = await apiClient.get<GlobalSearchResult>('/search/global', {
      params: { q, limit },
    });
    return response.data;
  },

  autocomplete: async (q: string, limit = 10): Promise<AutocompleteResult> => {
    const response = await apiClient.get<AutocompleteResult>('/search/autocomplete', {
      params: { q, limit },
    });
    return response.data;
  },

  searchProducts: async (params: Record<string, unknown>): Promise<unknown> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
};