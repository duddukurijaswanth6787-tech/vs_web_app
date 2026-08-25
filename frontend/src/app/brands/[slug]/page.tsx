'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductGridSection } from '@/components/storefront/ProductGridSection';
import { useBrandBySlug, useBrandProducts } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';
import { mapProductToItem } from '@/features/customer/mappers';

export default function BrandSlugPage() {
  const params = useParams();
  const slug = String(params.slug || '');
  const brand = useBrandBySlug(slug);
  const products = useBrandProducts(slug, { limit: 48 });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/brands" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">
          {brand.data?.name || 'Brand'}
        </h1>
      </header>

      <main className="flex-1">
        {(brand.isLoading || products.isLoading) && (
          <p className="px-4 py-6 text-sm text-neutral-500">Loading…</p>
        )}
        {(brand.error || products.error) && (
          <p className="px-4 py-6 text-sm text-red-600">
            {getApiErrorMessage(brand.error || products.error)}
          </p>
        )}
        <ProductGridSection
          title={brand.data?.name || 'Brand'}
          subtitle={brand.data?.description || `${products.data?.meta?.total ?? products.data?.data?.length ?? 0} products`}
          products={(products.data?.data || []).map(mapProductToItem)}
          viewAllHref="/brands"
        />
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
