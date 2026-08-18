import React from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { productService } from '@/features/catalog/products/product.service';
import { customerStorefrontService } from '@/features/customer/storefront.service';
import { customerReviewsService } from '@/features/customer/reviews.service';
import { variantService } from '@/features/catalog/variants/variant.service';
import { ProductDetailClient } from './ProductDetailClient';

// ponytail: inline keys to avoid importing from 'use client' module -- these
// MUST match the query keys the client hooks use (useCustomerProduct,
// useVariants, useProductReviews, useActiveCoupons in features/customer and
// features/catalog/variants), or hydration silently no-ops.
const productKey = (id: string) => ['customer', 'product', id] as const;
const productSlugKey = (slug: string) => ['customer', 'product-slug', slug] as const;
const variantsKey = (productId: string) => ['variants', 'list', { productId, limit: 100 }] as const;
const reviewsKey = (productId: string) => ['product', productId, 'reviews'] as const;
const couponsKey = ['customer', 'coupons'] as const;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  const productPromise = queryClient.prefetchQuery({
    queryKey: looksLikeUuid ? productKey(id) : productSlugKey(id),
    queryFn: () =>
      looksLikeUuid
        ? productService.findById(id)
        : customerStorefrontService.getProductBySlug(id),
    staleTime: 5 * 60 * 1000,
  });
  const couponsPromise = queryClient.prefetchQuery({
    queryKey: couponsKey,
    queryFn: () => customerStorefrontService.getActiveCoupons(),
    staleTime: 5 * 60 * 1000,
  });

  if (looksLikeUuid) {
    // The URL id already IS the product id, so variants and reviews don't
    // need to wait for the product fetch to resolve -- everything can run in
    // one parallel batch instead of a client-side waterfall after hydration.
    await Promise.all([
      productPromise,
      couponsPromise,
      queryClient.prefetchQuery({
        queryKey: variantsKey(id),
        queryFn: () => variantService.findAll({ productId: id, limit: 100 }),
      }),
      queryClient.prefetchQuery({
        queryKey: reviewsKey(id),
        queryFn: () => customerReviewsService.getProductReviews(id),
      }),
    ]);
  } else {
    // Slug route -- variants/reviews genuinely need the resolved product id
    // first, but coupons still run in parallel rather than waiting.
    await Promise.all([productPromise, couponsPromise]);
    const product = queryClient.getQueryData<{ id?: string }>(productSlugKey(id));
    if (product?.id) {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: variantsKey(product.id),
          queryFn: () => variantService.findAll({ productId: product.id!, limit: 100 }),
        }),
        queryClient.prefetchQuery({
          queryKey: reviewsKey(product.id),
          queryFn: () => customerReviewsService.getProductReviews(product.id!),
        }),
      ]);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailClient />
    </HydrationBoundary>
  );
}
