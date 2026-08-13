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

  const category = useCategoryBySlug(special ? '' : slug);
  const categoryProducts = useCategoryProducts(special ? '' : slug, { limit: 48 });
  const specialProducts = useCustomerProducts(special ? { ...special, limit: 48 } : { limit: 0 });
  const fallbackProducts = useCustomerProducts({ limit: 48 });

  const title = special
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : category.data?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fetched = special
    ? extractProducts(specialProducts.data)
    : extractProducts(categoryProducts.data);
  const fallback = extractProducts(fallbackProducts.data);
  const products = (fetched && fetched.length > 0) ? fetched : fallback;
  const loading = special ? specialProducts.isLoading : (categoryProducts.isLoading && fallbackProducts.isLoading);
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
