import { apiClient } from './client';

export interface GlobalSearchResult {
  products: { id: string; name: string; sku: string; slug: string; basePrice: number }[];
  orders: { id: string; orderNumber: string; status: string; grandTotal: number; currency: string }[];
  customers: { id: string; firstName: string; lastName: string; email: string }[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  coupons: { id: string; code: string; name: string; type: string }[];
}

export interface AutocompleteResult {
  products: { id: string; name: string; slug: string; basePrice: number }[];
  suggestions: string[];
}

export const searchService = {
  global: async (q: string, limit = 10): Promise<GlobalSearchResult> => {
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
};