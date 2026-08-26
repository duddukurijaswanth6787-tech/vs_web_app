'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCustomerBrands } from '@/features/customer/hooks';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import type { BrandResponse } from '@/features/catalog/brands/brand.types';

export default function BrandsPage() {
  const { data, isLoading, error } = useCustomerBrands({ limit: 100 });
  const brands = useMemo(() => data?.data || [], [data]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Brands</h1>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {isLoading && <p className="text-sm text-neutral-500">Loading brands…</p>}
        {error && <p className="text-sm text-red-600">Failed to load brands</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {brands.map((brand: BrandResponse) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-neutral-50 flex items-center justify-center p-4">
                <Image
                  src={brand.logo || brand.bannerImage || PLACEHOLDER_IMAGE}
                  alt={brand.name}
                  width={400}
                  height={300}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-3 text-center">
                <h2 className="text-sm font-bold">{brand.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
