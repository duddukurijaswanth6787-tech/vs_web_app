'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeaturedCategories } from '@/features/customer/hooks';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

type PromoCategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

export function PromoBannersSection() {
  const { data: catData, isLoading } = useFeaturedCategories();

  const categories: PromoCategoryItem[] = useMemo(() => {
    if (!catData) return [];
    const typed = catData as { data?: unknown[] } | unknown[];
    const list = Array.isArray(typed)
      ? typed
      : Array.isArray((typed as { data?: unknown[] })?.data)
      ? (typed as { data?: unknown[] }).data!
      : [];

    return list.map((cat) => {
      const c = cat as Record<string, unknown>;
      const rawImg = String(c.image || c.icon || c.imageUrl || c.primaryImageUrl || '');
      return {
        id: String(c.id || ''),
        name: String(c.name || ''),
        slug: String(c.slug || ''),
        description: String(c.description || 'Explore our exclusive collection'),
        image: (!rawImg || rawImg.includes('data:image/svg')) ? PLACEHOLDER_IMAGE : rawImg,
      };
    });
  }, [catData]);

  if (!isLoading && categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-[1440px] mx-auto py-4 sm:py-4 lg:hidden">
      <div className="flex overflow-x-auto gap-3.5 px-4 sm:px-6 pb-2.5 pt-1 scrollbar-none snap-x snap-mandatory">
        {categories.map((cat) => (
          <div
            key={cat.id || cat.slug}
            className="w-[85vw] max-w-[340px] sm:w-[360px] shrink-0 snap-start bg-[#EAF4FF] rounded-3xl p-4 sm:p-5 border border-sky-100/80 shadow-2xs flex items-center justify-between relative overflow-hidden group"
          >
            <div className="space-y-1.5 max-w-[62%] z-10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--brand-primary)] bg-sky-100/80 px-2 py-0.5 rounded-md">
                FOR YOUR SPECIAL DAY
              </span>
              <h3 className="text-base sm:text-lg font-bold font-serif text-neutral-900 leading-tight">
                {cat.name}
              </h3>
              <p className="text-[11px] text-neutral-600 font-medium line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
              <Link
                href={`/categories/${cat.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline pt-1"
              >
                <span>Explore Now</span>
                <span>→</span>
              </Link>
            </div>

            <div className="w-24 h-32 sm:w-28 sm:h-36 relative shrink-0 rounded-2xl overflow-hidden shadow-xs border border-white">
              <Image
                src={withVariant(cat.image, 'medium')}
                alt={cat.name}
                fill
                sizes="120px"
                unoptimized={isLocalOrPlaceholder(cat.image)}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
