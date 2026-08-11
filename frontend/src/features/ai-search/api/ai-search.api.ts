import { apiClient } from '@/lib/api/client';

export interface SearchQueryLog {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: string;
}

export interface TrendingSearch {
  query: string;
  count: number;
}

export const aiSearchApi = {
  performSearch: async (query: string) => {
    const res = await apiClient.post('/ai/search', { query });
    return res.data;
  },
  getSuggestions: async (q?: string) => {
    const res = await apiClient.get<string[]>(`/ai/search/suggestions?q=${q || ''}`);
    return res.data;
  },
  getHistory: async (page = 1, limit = 20) => {
    const res = await apiClient.get<SearchQueryLog[]>(`/ai/search/history?page=${page}&limit=${limit}`);
    return res.data;
  },
  getTrendingSearches: async () => {
    const res = await apiClient.get<TrendingSearch[]>('/ai/search/trending');
    return res.data;
  },
};
