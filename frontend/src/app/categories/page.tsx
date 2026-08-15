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
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { withVariant, resolveMediaUrl } from '@/lib/media-url';
import type { CategoryResponse } from '@/features/catalog/categories/category.types';
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'ethnic-wear': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop',
  'womens-wear': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop',
  'women-s-wear': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop',
  'sarees': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop',
  'lehengas': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop',
  'kurta-sets': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop',
  'kurtis-suits': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop',
  'indo-western': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop',
  'party-wear': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop',
  'wedding-collection': 'https://images.unsplash.com/photo-1546804764-9147f715b00e?w=600&auto=format&fit=crop',
  'festive-collection': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop',
  'western-wear': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
  'casual-wear': 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&auto=format&fit=crop',
  'office-wear': 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&auto=format&fit=crop',
};

const DEFAULT_CATEGORIES = Object.keys(CATEGORY_DEFAULT_IMAGES).map((slug, idx) => ({
  id: `cat-def-${idx}`,
  name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  slug,
  imageUrl: CATEGORY_DEFAULT_IMAGES[slug],
}));

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
        const rawImg = c.image || c.imageUrl || c.primaryImageUrl;
        const fallbackImg = CATEGORY_DEFAULT_IMAGES[c.slug] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop';
        const finalUrl = (!rawImg || rawImg.includes('data:image/svg')) ? fallbackImg : resolveMediaUrl(rawImg);
        return { ...c, imageUrl: finalUrl };
      });
  }, [all.data, featured.data]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
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
