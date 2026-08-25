'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductGridSection } from '@/components/storefront/ProductGridSection';
import { useCustomerProducts } from '@/features/customer/hooks';
import { mapProductToItem } from '@/features/customer/mappers';

export default function CollectionSlugPage() {
  const params = useParams();
  const slug = String(params.slug || '');
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const { data, isLoading } = useCustomerProducts({ limit: 100 });

  const products = useMemo(() => {
    const needle = slug.toLowerCase();
    return (data?.data || [])
      .filter((p) => (p.collections || []).some((c) => String(c).toLowerCase().replace(/\s+/g, '-') === needle))
      .map(mapProductToItem);
  }, [data, slug]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/collections" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">{title}</h1>
      </header>

      <main className="flex-1">
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Loading collection…</p>
        ) : (
          <ProductGridSection
            title={title}
            subtitle={`${products.length} products`}
            products={products}
            viewAllHref="/collections"
          />
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
