'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { resolveMediaUrl, isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { productService } from '@/features/catalog/products/product.service';

export function FeaturedBrands() {
  const { data: brandsData, isLoading } = useBrands({ limit: 12 });
  const brands = brandsData?.data || [];
  const queryClient = useQueryClient();

  const handleMouseEnter = (brandId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['customer', 'products', { brandId, limit: 48 }],
      queryFn: () => productService.findAll({ brandId, limit: 48 }),
      staleTime: 60000,
    });
  };

  if (isLoading) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-neutral-100 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-neutral-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!brands.length) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1769D2] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Label Directory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight">
            Designer Brands & Labels
          </h2>
        </div>

        <Link
          href="/brands"
          className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#1769D2] hover:text-[#0B3B78] transition-colors"
        >
          <span>View All Brands</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((brand) => {
          const logoUrl = brand.logo ? resolveMediaUrl(brand.logo) : null;

          return (
            <Link
              key={brand.id}
              href={`/products?brandId=${brand.id}`}
              onMouseEnter={() => handleMouseEnter(brand.id)}
              className="group relative bg-white border border-neutral-200/80 hover:border-[#1769D2]/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Logo or Initials Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-50 flex items-center justify-center p-2 mb-3 border border-neutral-100 group-hover:border-rose-200 transition-colors overflow-hidden">
                {logoUrl ? (
                  <Image
                    src={withVariant(logoUrl, 'thumb')}
                    alt={brand.name}
                    width={80}
                    height={80}
                    unoptimized={isLocalOrPlaceholder(logoUrl)}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="font-serif font-bold text-lg text-[#1769D2]">
                    {brand.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Brand Title */}
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-[#1769D2] transition-colors line-clamp-1">
                {brand.name}
              </h3>

              {/* Status Badge */}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Label</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
