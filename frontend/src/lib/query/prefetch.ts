import { QueryClient } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000/api/v1';

// ponytail: inline keys to avoid importing from 'use client' module
const keys = {
  categories: ['customer', 'categories'] as const,
  publicSettings: ['customer', 'public-settings'] as const,
  banners: ['customer', 'banners'] as const,
  coupons: ['customer', 'coupons'] as const,
  reels: ['customer', 'reels'] as const,
};

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
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
