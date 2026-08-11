'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductGridSection } from '@/components/storefront/ProductGridSection';
import { useCategoryBySlug, useCategoryProducts, useCustomerProducts } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

export default function CategorySlugPage() {
  const params = useParams();
  const slug = String(params.slug || '');
  const special =
    slug === 'new-arrivals'
      ? { isNewArrival: true }
      : slug === 'best-sellers'
        ? { isBestSeller: true }
        : slug === 'trending'
          ? { isFeatured: true }
          : null;

  const category = useCategoryBySlug(special ? '' : slug);
  const categoryProducts = useCategoryProducts(special ? '' : slug, { limit: 48 });
  const specialProducts = useCustomerProducts(special ? { ...special, limit: 48 } : { limit: 0 });
  const fallbackProducts = useCustomerProducts({ limit: 48 });

  const title = special
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : category.data?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fetched = special
    ? ((specialProducts.data as any)?.items || (specialProducts.data as any)?.data || (Array.isArray(specialProducts.data) ? specialProducts.data : []))
    : ((categoryProducts.data as any)?.items || (categoryProducts.data as any)?.data || (Array.isArray(categoryProducts.data) ? categoryProducts.data : []));
  const fallback = (fallbackProducts.data as any)?.items || (fallbackProducts.data as any)?.data || (Array.isArray(fallbackProducts.data) ? fallbackProducts.data : []);
  const products = (fetched && fetched.length > 0) ? fetched : fallback;
  const loading = special ? specialProducts.isLoading : (categoryProducts.isLoading && fallbackProducts.isLoading);
  const error = special ? specialProducts.error : categoryProducts.error || category.error;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/categories" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">{title}</h1>
      </header>

      <main className="flex-1">
        {loading && <p className="px-4 py-6 text-sm text-neutral-500">Loading products…</p>}
        {error && products.length === 0 && (
          <p className="px-4 py-6 text-sm text-red-600 font-medium">{getApiErrorMessage(error)}</p>
        )}
        {!loading && (
          <ProductGridSection
            title={title}
            subtitle={`${products.length} products`}
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
