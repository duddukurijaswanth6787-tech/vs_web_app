import { QueryClient } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000/api/v1';

// ponytail: inline keys to avoid importing from 'use client' module
// NOTE: these MUST exactly match the queryKey used by the real client-side
// hooks that consume this data (features/customer/hooks.ts,
// features/social/social.hooks.ts), or React Query hydration silently no-ops
// and the client re-fetches from scratch — causing a flash of default/empty
// state before the real data arrives.
const keys = {
  categories: ['customer'] as const,
  publicSettings: ['public-settings'] as const,
  banners: ['banners'] as const,
  coupons: ['customer', 'coupons'] as const,
  reels: ['social', 'public-reels'] as const,
};

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export async function prefetchStorefrontData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: keys.categories,
      queryFn: () => apiFetch('/categories/featured'),
      staleTime: 30 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: keys.publicSettings,
      queryFn: () => apiFetch('/settings/public'),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: keys.banners,
      queryFn: () => apiFetch('/cms/banners?isActive=true&limit=10'),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: keys.coupons,
      queryFn: () => apiFetch('/coupons/active'),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: keys.reels,
      queryFn: () => apiFetch('/social/reels?limit=20'),
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}
