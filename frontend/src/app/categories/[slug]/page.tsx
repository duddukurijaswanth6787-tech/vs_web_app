'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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

  // Only the branch actually taken should hit the network -- previously all
  // four queries fired unconditionally, including two that always ran with
  // an empty slug or a limit of 0 on whichever branch wasn't active.
  const category = useCategoryBySlug(slug, !special);
  const categoryProducts = useCategoryProducts(slug, { limit: 48 }, !special);
  const specialProducts = useCustomerProducts(
    { ...(special ?? {}), limit: 48 },
    { enabled: !!special },
  );

  const title = special
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : category.data?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fetched = special
    ? extractProducts(specialProducts.data)
    : extractProducts(categoryProducts.data);
  const primaryDone = special ? specialProducts.isSuccess : categoryProducts.isSuccess;
  const needsFallback = primaryDone && fetched.length === 0;

  // Only fetched once the primary query has actually come back empty --
  // previously this fired unconditionally on every category page load even
  // when the category already had products.
  const fallbackProducts = useCustomerProducts({ limit: 48 }, { enabled: needsFallback });
  const fallback = extractProducts(fallbackProducts.data);
  const products = fetched.length > 0 ? fetched : fallback;
  const loading = special
    ? specialProducts.isLoading
    : categoryProducts.isLoading || (needsFallback && fallbackProducts.isLoading);
  const error = special ? specialProducts.error : categoryProducts.error || category.error;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="flex-1">
        {loading && <p className="px-4 py-6 text-sm text-neutral-500">Loading products…</p>}
        {error && products.length === 0 && (
          <p className="px-4 py-6 text-sm text-red-600 font-medium">{getApiErrorMessage(error)}</p>
        )}
        {!loading && (
          <ProductGridSection
            title={title}
            subtitle={`${products.length} products`}
            products={products.map(mapProductToItem)}
            viewAllHref="/categories"
          />
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
