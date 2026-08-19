import { apiClient } from '@/lib/api/client';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

export interface SearchQueryLog {
  id: string;
  query: string;
  resultCount: number;
  clickedProductIds: string[];
  createdAt: string;
}

export interface TrendingSearch {
  query: string;
  count: number;
}

export interface SearchSuggestions {
  products: Array<{ id: string; name: string; slug: string; price: number }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
}

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  price: number;
  originalPrice: number;
  image?: string;
  score: number;
}

export interface SearchStats {
  totalSearches: number;
  zeroResultCount: number;
  zeroResultRate: number;
  clickThroughRate: number;
  topQuery?: TrendingSearch;
}

type ApiResponse<T> = StandardResponse<T>;

export const aiSearchApi = {
  performSearch: async (query: string) => {
    const res = await apiClient.post<
      ApiResponse<{ historyId: string; query: string; resultCount: number; results: SearchResult[] }>
    >('/ai/search', { query });
    return res.data.data!;
  },
  getSuggestions: async (q?: string) => {
    const res = await apiClient.get<ApiResponse<SearchSuggestions>>('/ai/search/suggestions', {
      params: { q },
    });
    return res.data.data!;
  },
  getHistory: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<SearchQueryLog>>>('/ai/search/history', {
      params: { page, limit },
    });
    return res.data.data!;
  },
  getTrendingSearches: async () => {
    const res = await apiClient.get<ApiResponse<TrendingSearch[]>>('/ai/search/trending');
    return res.data.data!;
  },
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<SearchStats>>('/ai/search/stats');
    return res.data.data!;
  },
};
