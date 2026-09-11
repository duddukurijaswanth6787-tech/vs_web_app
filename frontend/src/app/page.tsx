import React from 'react';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { productService } from '@/features/catalog/products/product.service';
import { categoryService } from '@/features/catalog/categories/category.service';
import { customerStorefrontService } from '@/features/customer/storefront.service';
import { mapProductToItem } from '@/features/customer/mappers';
import { HomeClient } from '@/components/storefront/HomeClient';
import type { ProductQueryDto } from '@/features/catalog/products/product.types';

export default async function Home() {
  const queryClient = new QueryClient();

  const fetchProducts = async (query: ProductQueryDto) => {
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
      console.error('Prefetch products error:', e);
      return { data: [], total: 0, items: [] };
    }
  };

  const fetchFeaturedCategories = async () => {
    try {
      const res = await categoryService.findFeatured();
      if (Array.isArray(res) && res.length > 0) return res;
      const fallback = await categoryService.findAll({ isVisible: true, status: 'ACTIVE' });
      return (fallback as any)?.items || (fallback as any)?.data || fallback || [];
    } catch (e) {
      console.error('Prefetch categories error:', e);
      return [];
    }
  };

  // Prefetch Banners, Categories, Settings, and Products in parallel on the server
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['banners'],
      queryFn: () => customerStorefrontService.getBanners(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['customer', 'featured-categories'],
      queryFn: () => fetchFeaturedCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['homepage'],
      queryFn: () => customerStorefrontService.getHomepage(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['public-settings'],
      queryFn: () => customerStorefrontService.getPublicSettings(),
    }),
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
