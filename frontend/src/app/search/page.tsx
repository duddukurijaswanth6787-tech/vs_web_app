'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductGridSection } from '@/components/storefront/ProductGridSection';
import { useCustomerProducts, useCustomerSearch } from '@/features/customer/hooks';
import { mapProductToItem } from '@/features/customer/mappers';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get('q') || '';
  const [q, setQ] = useState(initial);
  const search = useCustomerSearch(q);
  const productsFallback = useCustomerProducts({ search: q, limit: 48 });

  const products = useMemo(() => {
    const fromSearch = search.data as Record<string, unknown>;
    const list =
      (fromSearch?.products as { data?: unknown[] })?.data ||
      (fromSearch?.data as { products?: unknown[] })?.products ||
      fromSearch?.products ||
      fromSearch?.data ||
      [];
    if (Array.isArray(list) && list.length && list[0]?.name) {
      return list.map(mapProductToItem);
    }
    const fallbackList = productsFallback.data?.data || (Array.isArray(productsFallback.data) ? productsFallback.data : []);
    return Array.isArray(fallbackList) ? fallbackList.map(mapProductToItem) : [];
  }, [search.data, productsFallback.data]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[#800020]">Search</h1>
        </div>
        <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
          <SearchIcon className="w-4 h-4 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sarees, lehengas, kurtis…"
            className="flex-1 text-sm outline-none"
          />
        </div>
      </header>

      <main className="flex-1">
        {q.trim().length < 2 ? (
          <p className="px-4 py-8 text-sm text-neutral-500">Type at least 2 characters to search</p>
        ) : (
          <ProductGridSection
            title={`Results for “${q}”`}
            subtitle={
              search.isLoading || productsFallback.isLoading
                ? 'Searching…'
                : `${products.length} products`
            }
            products={products}
            viewAllHref="/categories"
          />
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans">Loading...</div>}>
      <SearchPageContent />
    </React.Suspense>
  );
}
