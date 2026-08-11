import React from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { productService } from '@/features/catalog/products/product.service';
import { mapProductToItem } from '@/features/customer/mappers';
import { HomeClient } from '@/components/storefront/HomeClient';

export default async function Home() {
  const queryClient = new QueryClient();

  const fetchProducts = async (query: any) => {
    try {
      const result = await productService.findAll({
        isPublished: true,
        status: 'ACTIVE',
        ...query,
      });
      return {
        ...result,
        items: result.data.map(mapProductToItem),
      };
    } catch (e) {
      console.error('Prefetch error:', e);
      return { data: [], total: 0, items: [] };
    }
  };

  // Prefetch Home grids in parallel on the server
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['customer', 'products', { isNewArrival: true, limit: 12 }],
      queryFn: () => fetchProducts({ isNewArrival: true, limit: 12 }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['customer', 'products', { isBestSeller: true, limit: 12 }],
      queryFn: () => fetchProducts({ isBestSeller: true, limit: 12 }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['customer', 'products', { isFeatured: true, limit: 12 }],
      queryFn: () => fetchProducts({ isFeatured: true, limit: 12 }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  );
}
