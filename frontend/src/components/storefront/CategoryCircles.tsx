'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeaturedCategories } from '@/features/customer/hooks';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'c1', name: 'Party Wear', slug: 'party-wear' },
  { id: 'c2', name: 'Indo Western', slug: 'indo-western' },
  { id: 'c3', name: 'Kurta Sets', slug: 'kurta-sets' },
  { id: 'c4', name: 'Ethnic Wear', slug: 'ethnic-wear' },
  { id: 'c5', name: 'Sarees', slug: 'sarees' },
  { id: 'c6', name: 'Western Wear', slug: 'western-wear' },
  { id: 'c7', name: 'Lehengas', slug: 'lehengas' },
  { id: 'c8', name: 'Office Wear', slug: 'office-wear' },
  { id: 'c9', name: 'Casual Wear', slug: 'casual-wear' },
  { id: 'c10', name: 'Wedding Collection', slug: 'wedding-collection' },
  { id: 'c11', name: 'Festive Collection', slug: 'festive-collection' },
];

export function CategoryCircles() {
  const { data: catData, isLoading } = useFeaturedCategories();

  const categories: CategoryItem[] = useMemo(() => {
    const list = Array.isArray(catData) ? catData : (catData as any)?.data || [];
    
    // Filter to only show main categories
    const mainCategories = list.filter((cat: any) => !cat.parentId);

    if (mainCategories.length > 0) {
      return mainCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.image || c.imageUrl || c.primaryImageUrl || PLACEHOLDER_IMAGE,
      }));
    }
    return DEFAULT_CATEGORIES;
  }, [catData]);

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/categories"
          className="text-xs sm:text-sm font-bold text-[#800020] hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <span>View All Categories</span>
          <span>→</span>
        </Link>
      </div>

      {/* Circle Categories Row */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[100px]">
              <div className="w-[100px] h-[100px] rounded-full bg-neutral-100 animate-pulse border border-neutral-200/60" />
              <div className="w-16 h-3 bg-neutral-100 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
          {categories.map((cat) => {
            const rawSrc = cat.imageUrl || PLACEHOLDER_IMAGE;
            const src = withVariant(rawSrc, 'thumb');

            return (
              <Link
                key={cat.id || cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 shrink-0 snap-start group w-[85px] sm:w-[100px] text-center"
              >
                {/* Circle Container (100px diameter with border & shadow) */}
                <div className="w-[85px] h-[85px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden border-2 border-rose-100/80 p-0.5 bg-white shadow-2xs group-hover:border-[#800020] group-hover:shadow-md transition-all duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <Image
                      src={src}
                      alt={cat.name}
                      fill
                      sizes="100px"
                      unoptimized={isLocalOrPlaceholder(src)}
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Category Label */}
                <span className="text-xs font-bold text-neutral-800 group-hover:text-[#800020] transition-colors line-clamp-1 leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
