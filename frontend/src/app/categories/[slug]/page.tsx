'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductGridSection } from '@/components/storefront/ProductGridSection';
import { useCategoryBySlug, useCategoryProducts, useCustomerProducts } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';
import { mapProductToItem } from '@/features/customer/mappers';
import type { ProductResponse, ProductListResponse } from '@/features/catalog/products/product.types';

function extractProducts(data: ProductListResponse | ProductResponse[] | undefined): ProductResponse[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data ?? [];
}

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

  const category = useCategoryBySlug(slug, !special);
  const categoryProducts = useCategoryProducts(slug, { limit: 48 }, !special);
  const specialProducts = useCustomerProducts(
    { ...(special ?? {}), limit: 48 },
    { enabled: !!special },
  );

  const title = special
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : category.data?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const products = special
    ? extractProducts(specialProducts.data)
    : extractProducts(categoryProducts.data);
  const loading = special ? specialProducts.isLoading : (categoryProducts.isLoading || category.isLoading);
  const error = special ? specialProducts.error : (categoryProducts.error || category.error);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <StorefrontHeader />

      <main className="flex-1">
        {loading && (
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-neutral-500">
            <p>Loading products…</p>
          </div>
        )}
        {error && products.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12 text-center">
            <p className="text-sm text-red-600 font-medium">{getApiErrorMessage(error)}</p>
          </div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-neutral-900">{title}</h1>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              No products found in this category yet. New arrivals and designs will be added soon!
            </p>
            <div className="pt-2">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-primary)] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" /> Explore Other Categories
              </Link>
            </div>
          </div>
        )}
        {!loading && products.length > 0 && (
          <ProductGridSection
            title={title}
            subtitle={`${products.length} ${products.length === 1 ? 'product' : 'products'}`}
            products={products.map(mapProductToItem)}
          />
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
