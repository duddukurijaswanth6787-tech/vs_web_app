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
  features: ['storefront-features'] as const,
};

// Throws on failure rather than swallowing to null: prefetchQuery marks a
// thrown query as status 'error', and dehydrate() skips error queries by
// default, so a failed SSR prefetch simply hydrates nothing for that key --
// the client-side useQuery then runs its own fetch immediately instead of
// treating a dead SSR result as fresh, successful, empty data for the full
// staleTime window (previously up to 30 minutes of a section looking empty).
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} fetching ${API}${path}`);
  }
  const json = await res.json();
  return json.data ?? json;
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
    // Prefetched so feature-gated sections (e.g. returns) render at their real
    // visibility on first paint instead of popping in after hydration.
    queryClient.prefetchQuery({
      queryKey: keys.features,
      queryFn: () => apiFetch('/features'),
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}
