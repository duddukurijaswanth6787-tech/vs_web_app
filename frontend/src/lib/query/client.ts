  import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      staleTime: 0, // Zero stale time ensures UI always receives live data instantly
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        // Do not retry authorization or client validation/not found exceptions
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && [400, 401, 403, 404, 422].includes(status)) {
          return false;
        }
        return failureCount < 2; // Retry transient network glitches at most twice
      },
    },
  },
});

// Centralized Query Key Factories
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  dashboard: {
    summary: () => ['dashboard', 'summary'] as const,
    salesChart: (period?: string) => ['dashboard', 'salesChart', period || 'monthly'] as const,
  },
  health: {
    status: () => ['system', 'health'] as const,
  },
  search: {
    global: (q: string, limit?: number) => ['search', 'global', q, limit] as const,
    autocomplete: (q: string, limit?: number) => ['search', 'autocomplete', q, limit] as const,
    products: (params: Record<string, unknown>) => ['search', 'products', params] as const,
  },
};
