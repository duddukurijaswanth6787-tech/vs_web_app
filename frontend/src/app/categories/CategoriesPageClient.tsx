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
        // No stock-photo fallback: showing a random Unsplash model for a
        // category the admin never gave an image to made the catalog look
        // populated when it was not. Null here renders an explicit Empty tile.
        const rawImg = c.image || c.imageUrl || c.primaryImageUrl;
        const hasImage = !!rawImg && !rawImg.includes('data:image/svg');
        return { ...c, imageUrl: hasImage ? resolveMediaUrl(rawImg) : null };
      });
  }, [all.data, featured.data]);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
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
                  {cat.imageUrl ? (
                    <Image
                      src={withVariant(cat.imageUrl, 'medium')}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 border-b border-neutral-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Empty</span>
                    </div>
                  )}
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
