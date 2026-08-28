'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeaturedCategories } from '@/features/customer/hooks';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

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

export function CategoryCircles() {
  const { data: catData, isLoading } = useFeaturedCategories();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const categories: CategoryItem[] = useMemo(() => {
    if (!catData) return [];
    const typed = catData as { data?: unknown[] } | unknown[];
    const list = Array.isArray(typed) ? typed : Array.isArray((typed as { data?: unknown[] })?.data) ? (typed as { data?: unknown[] }).data! : [];

    const mainCategories = list.filter((cat) => {
      const c = cat as Record<string, unknown>;
      return !c.parentId && c.status !== 'ARCHIVED';
    });

    return mainCategories.map((cat) => {
      const c = cat as Record<string, unknown>;
      const rawImg = String(c.icon || c.image || c.imageUrl || c.primaryImageUrl || '');
      const slug = String(c.slug || '');
      const hasImage = !!rawImg && !rawImg.includes('data:image/svg');
      const finalUrl = hasImage ? rawImg : '';
      return {
        id: String(c.id || ''),
        name: String(c.name || ''),
        slug,
        imageUrl: finalUrl,
      };
    });
  }, [catData]);

  if (!isLoading && categories.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-[var(--category-bg)] text-[var(--category-text)]">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/categories"
          className="text-xs sm:text-sm font-bold text-[#1769D2] hover:underline inline-flex items-center gap-1 shrink-0"
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
            const hasFailed = failedImages[cat.id];
            const src = (cat.imageUrl && !hasFailed) ? withVariant(cat.imageUrl, 'thumb') : '';

            return (
              <Link
                key={cat.id || cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 shrink-0 snap-start group w-[85px] sm:w-[100px] text-center"
              >
                {/* Circle Container (100px diameter with border & shadow) */}
                <div className="w-[85px] h-[85px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden border-2 border-[#DCEBFA] p-0.5 bg-white shadow-2xs group-hover:border-[#1769D2] group-hover:shadow-md transition-all duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    {src ? (
                      <Image
                        src={src}
                        alt={cat.name}
                        fill
                        sizes="100px"
                        unoptimized={isLocalOrPlaceholder(src)}
                        onError={() => setFailedImages((prev) => ({ ...prev, [cat.id]: true }))}
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Empty</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Label */}
                <span className="text-xs font-bold text-neutral-800 group-hover:text-[#1769D2] transition-colors line-clamp-1 leading-tight">
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
