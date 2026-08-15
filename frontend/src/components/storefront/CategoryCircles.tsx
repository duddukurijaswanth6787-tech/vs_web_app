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

// Per-slug image fallback so newly-created categories without an uploaded
// image still render a themed circle instead of a grey placeholder. This is
// a display fallback only — no category is ever synthesized here that admin
// doesn't have in the database.
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

export function CategoryCircles() {
  const { data: catData, isLoading } = useFeaturedCategories();

  const categories: CategoryItem[] = useMemo(() => {
    if (!catData) return [];
    const typed = catData as { data?: unknown[] } | unknown[];
    const list = Array.isArray(typed) ? typed : Array.isArray((typed as { data?: unknown[] })?.data) ? (typed as { data?: unknown[] }).data! : [];

    // Root-level, non-archived categories only. Whatever admin has created
    // (or nothing) is what the storefront shows — no hardcoded fallback that
    // lets categories exist on the customer side that admin can't manage.
    const mainCategories = list.filter((cat) => {
      const c = cat as Record<string, unknown>;
      return !c.parentId && c.status !== 'ARCHIVED';
    });

    return mainCategories.map((cat) => {
      const c = cat as Record<string, unknown>;
      const rawImg = String(c.image || c.imageUrl || c.primaryImageUrl || '');
      const slug = String(c.slug || '');
      const fallbackImg = CATEGORY_DEFAULT_IMAGES[slug] || PLACEHOLDER_IMAGE;
      const finalUrl = (!rawImg || rawImg.includes('data:image/svg')) ? fallbackImg : rawImg;
      return {
        id: String(c.id || ''),
        name: String(c.name || ''),
        slug,
        imageUrl: finalUrl,
      };
    });
  }, [catData]);

  // Hide the whole section if there's nothing to show — a "Shop by Category"
  // heading with no circles under it reads as broken, not empty-on-purpose.
  if (!isLoading && categories.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
