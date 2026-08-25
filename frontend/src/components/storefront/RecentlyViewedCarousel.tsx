'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { History, Trash2 } from 'lucide-react';
import { useRecentlyViewed, useClearRecentlyViewed } from '@/features/recently-viewed/recently-viewed.hooks';
import { PLACEHOLDER_IMAGE, formatInr } from '@/features/customer/mappers';
import { useAuth } from '@/hooks/useAuth';

export function RecentlyViewedCarousel() {
  const { isAuthenticated } = useAuth();
  const { data: items = [], isLoading } = useRecentlyViewed(10, isAuthenticated);
  const clearMutation = useClearRecentlyViewed();

  if (!isAuthenticated || (!isLoading && items.length === 0)) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#0284c7]" />
          <h3 className="text-lg font-bold font-serif text-neutral-900">
            Recently Viewed Garments
          </h3>
        </div>
        <button
          type="button"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="text-xs font-bold text-neutral-500 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          const imgUrl = product.primaryImageUrl || PLACEHOLDER_IMAGE;
          const displayPrice = product.salePrice || product.basePrice;

          return (
            <Link
              key={item.id}
              href={`/product/${product.slug || product.id}`}
              className="flex flex-col shrink-0 w-[160px] sm:w-[180px] bg-white border border-neutral-200/80 rounded-2xl overflow-hidden group shadow-2xs hover:shadow-md transition-all snap-start"
            >
              <div className="w-full h-44 relative bg-neutral-50 overflow-hidden">
                <Image
                  src={imgUrl}
                  alt={product.name}
                  fill
                  sizes="180px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3 space-y-1">
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 group-hover:text-[#0284c7] transition-colors">
                  {product.name}
                </h4>
                <div className="text-xs font-bold text-[#0284c7]">
                  {formatInr(displayPrice)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
