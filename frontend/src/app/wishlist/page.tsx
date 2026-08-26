'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, ShoppingBag, Trash2, RefreshCw } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerWishlist, useWishlistMutations } from '@/features/customer/hooks';
import { formatInr, PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

export default function WishlistPage() {
  useAuth();
  const { data, isLoading, error, refetch } = useCustomerWishlist(true);
  const { remove, moveToCart } = useWishlistMutations();

  const items = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { data?: unknown[]; items?: unknown[] };
    if (Array.isArray(typed?.data)) return typed.data as never[];
    if (Array.isArray(typed?.items)) return typed.items as never[];
    return [];
  }, [data]);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-4">
        {isLoading && <p className="text-sm text-neutral-500">Loading wishlist…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Heart className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="text-sm text-neutral-600">No saved items yet</p>
            <Link href="/categories" className="inline-block bg-[var(--brand-primary)] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
              Browse Products
            </Link>
          </div>
        )}

        {items.map((item, idx) => {
          const pItem = item as Record<string, unknown>;
          const product = (pItem.product || pItem) as Record<string, unknown>;
          const productId = String(pItem.productId || product.id || idx);
          const name = String(product.name || pItem.productName || 'Product');
          const images = Array.isArray(product.images) ? product.images : [];
          const firstImage = images[0] as Record<string, unknown> | undefined;
          const image = String(product.primaryImageUrl || firstImage?.url || PLACEHOLDER_IMAGE);
          const price = Number(product.salePrice ?? product.basePrice ?? pItem.unitPrice ?? 0);
          return (
            <div key={String(pItem.id || productId)} className="bg-white border border-neutral-200 rounded-2xl p-4 flex gap-3">
              <Link href={`/product/${product.slug || productId}`}>
                <Image 
                  src={withVariant(image, 'medium')} 
                  alt={name} 
                  width={80} 
                  height={96} 
                  unoptimized={isLocalOrPlaceholder(image)}
                  className="w-20 h-24 object-cover rounded-xl bg-neutral-100" 
                />
              </Link>
              <div className="flex-1 min-w-0 space-y-2">
                <Link href={`/product/${product.slug || productId}`} className="text-sm font-bold line-clamp-2 hover:text-[var(--brand-primary)]">
                  {name}
                </Link>
                <p className="text-sm font-bold text-[var(--brand-primary)]">{formatInr(Number(price))}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveToCart.mutate(productId)}
                    className="text-xs font-bold bg-[var(--brand-primary)] text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(productId)}
                    className="text-xs font-bold text-neutral-500 px-2 py-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
