'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useFeaturedCategories } from '@/features/customer/hooks';
import { categoryService } from '@/features/catalog/categories/category.service';
import { useQuery } from '@tanstack/react-query';
import { withVariant, resolveMediaUrl } from '@/lib/media-url';
import { getCategoryFallbackImage } from '@/lib/category-images';
import type { CategoryResponse } from '@/features/catalog/categories/category.types';

export default function CategoriesPage() {
  const featured = useFeaturedCategories();
  const all = useQuery({
    queryKey: ['customer', 'all-categories'],
    queryFn: () => categoryService.findAll({ isVisible: true, limit: 100 }),
  });

  const categories = useMemo(() => {
    if (!all.data && !featured.data) return [];
    const fromAll = (all.data && 'data' in all.data) ? (all.data as { data: CategoryResponse[] }).data : (Array.isArray(all.data) ? all.data : []);
    const fromFeatured = Array.isArray(featured.data) ? featured.data : [];
    const list = fromAll.length ? fromAll : fromFeatured;

    return list
      .filter((c: CategoryResponse) => c.status !== 'ARCHIVED')
      .map((c: CategoryResponse) => {
        const rawImg = c.icon || c.image || c.imageUrl || c.primaryImageUrl || (c as any).bannerImage || (c as any).bannerUrl;
        const hasImage = !!rawImg && !rawImg.includes('data:image/svg') && rawImg !== 'undefined';
        const finalUrl = hasImage ? resolveMediaUrl(rawImg) : getCategoryFallbackImage(c.slug, c.name);
        return { ...c, imageUrl: finalUrl };
      });
  }, [all.data, featured.data]);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <StorefrontHeader />

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {(all.isLoading || featured.isLoading) && (
          <p className="text-sm text-neutral-500">Loading categories…</p>
        )}
        {!all.isLoading && !featured.isLoading && categories.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-sm font-semibold text-neutral-600">No categories registered yet in catalog.</p>
            <p className="text-xs text-neutral-400">Add categories in the Admin Taxonomy Manager to display them here.</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                  <Image
                    src={withVariant(cat.imageUrl || getCategoryFallbackImage(cat.slug, cat.name), 'medium')}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h2 className="text-sm font-bold text-neutral-900 line-clamp-1">{cat.name}</h2>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
