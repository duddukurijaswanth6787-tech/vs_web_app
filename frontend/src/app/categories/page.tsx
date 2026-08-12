'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useFeaturedCategories } from '@/features/customer/hooks';
import { categoryService } from '@/features/catalog/categories/category.service';
import { useQuery } from '@tanstack/react-query';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { withVariant, resolveMediaUrl } from '@/lib/media-url';
import type { CategoryResponse } from '@/features/catalog/categories/category.types';

const DEFAULT_CATEGORIES = [
  { id: 'c1', name: 'Party Wear', slug: 'party-wear', imageUrl: '' },
  { id: 'c2', name: 'Indo Western', slug: 'indo-western', imageUrl: '' },
  { id: 'c3', name: 'Kurta Sets', slug: 'kurta-sets', imageUrl: '' },
  { id: 'c4', name: 'Ethnic Wear', slug: 'ethnic-wear', imageUrl: '' },
  { id: 'c5', name: 'Sarees', slug: 'sarees', imageUrl: '' },
  { id: 'c6', name: 'Western Wear', slug: 'western-wear', imageUrl: '' },
  { id: 'c7', name: 'Lehengas', slug: 'lehengas', imageUrl: '' },
  { id: 'c8', name: 'Office Wear', slug: 'office-wear', imageUrl: '' },
  { id: 'c9', name: 'Casual Wear', slug: 'casual-wear', imageUrl: '' },
  { id: 'c10', name: 'Wedding Collection', slug: 'wedding-collection', imageUrl: '' },
  { id: 'c11', name: 'Festive Collection', slug: 'festive-collection', imageUrl: '' },
];

export default function CategoriesPage() {
  const featured = useFeaturedCategories();
  const all = useQuery({
    queryKey: ['customer', 'all-categories'],
    queryFn: () => categoryService.findAll({ isVisible: true, limit: 100 }),
  });

  const categories = useMemo(() => {
    const fromAll = (all.data && 'data' in all.data) ? (all.data as { data: CategoryResponse[] }).data : (Array.isArray(all.data) ? all.data : []);
    if (fromAll.length) {
      return fromAll.map((c: CategoryResponse) => {
        const rawImg = c.image || c.imageUrl || c.primaryImageUrl;
        return { ...c, imageUrl: rawImg ? resolveMediaUrl(rawImg) : PLACEHOLDER_IMAGE };
      });
    }
    const fromFeatured = Array.isArray(featured.data) ? featured.data : [];
    if (fromFeatured.length) {
      return fromFeatured.map((c: CategoryResponse) => {
        const rawImg = c.image || c.imageUrl || c.primaryImageUrl;
        return { ...c, imageUrl: rawImg ? resolveMediaUrl(rawImg) : PLACEHOLDER_IMAGE };
      });
    }
    return DEFAULT_CATEGORIES;
  }, [all.data, featured.data]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">All Categories</h1>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {(all.isLoading || featured.isLoading) && (
          <p className="text-sm text-neutral-500">Loading categories…</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const fallbackSrc = PLACEHOLDER_IMAGE;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                  <Image
                    src={withVariant(cat.imageUrl || fallbackSrc, 'medium')}
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
