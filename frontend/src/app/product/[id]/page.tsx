import React from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { productService } from '@/features/catalog/products/product.service';
import { customerStorefrontService } from '@/features/customer/storefront.service';
import { ProductDetailClient } from './ProductDetailClient';

// ponytail: inline keys to avoid importing from 'use client' module
const productKey = (id: string) => ['customer', 'product', id] as const;
const productSlugKey = (slug: string) => ['customer', 'product-slug', slug] as const;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  await queryClient.prefetchQuery({
    queryKey: looksLikeUuid ? productKey(id) : productSlugKey(id),
    queryFn: () =>
      looksLikeUuid
        ? productService.findById(id)
        : customerStorefrontService.getProductBySlug(id),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailClient />
    </HydrationBoundary>
  );
}
