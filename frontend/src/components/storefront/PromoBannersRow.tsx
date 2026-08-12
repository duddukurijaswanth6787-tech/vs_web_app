'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useActiveCoupons, useFeaturedCategories } from '@/features/customer/hooks';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

export function PromoBannersRow() {
  const coupons = useActiveCoupons();
  const categories = useFeaturedCategories();

  const coupon = useMemo(() => {
    const typedCoupons = coupons.data as { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>> | undefined;
    const list = Array.isArray((typedCoupons as { data?: Array<Record<string, unknown>> })?.data)
      ? (typedCoupons as { data?: Array<Record<string, unknown>> }).data!
      : Array.isArray(typedCoupons)
        ? typedCoupons
        : [];
    return list[0];
  }, [coupons.data]);

  const cards = useMemo(() => {
    const list = Array.isArray(categories.data) ? (categories.data as unknown as Array<Record<string, unknown>>) : [];
    return list.slice(0, 4).map((c) => ({
      name: String(c.name || ''),
      image: String(c.image || c.bannerImage || PLACEHOLDER_IMAGE),
      href: `/categories/${c.slug}`,
    }));
  }, [categories.data]);

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-2 sm:py-6 space-y-4 sm:space-y-8">
      {coupon && (
        <div className="bg-[#FAF0F2] border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#800020] leading-tight">
                {String(coupon.name || 'Special Offer')}
              </h4>
              <p className="text-xs font-medium text-neutral-700">
                {String(coupon.description || 'Use this coupon at checkout')}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto bg-white border border-dashed border-[#800020] text-[#800020] px-4 py-2 rounded-xl text-xs font-bold text-center tracking-wider shadow-xs">
            Use Code: <span className="font-extrabold uppercase">{String(coupon.code || '')}</span>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight">
              Shop by Category
            </h2>
            <Link
              href="/categories"
              className="text-xs font-semibold text-[#800020] hover:text-[#600018] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group relative rounded-2xl overflow-hidden aspect-3/4 bg-amber-50 border border-neutral-100 shadow-xs hover:shadow-md transition-all"
              >
                <Image
                  src={withVariant(cat.image, 'medium')}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized={isLocalOrPlaceholder(cat.image)}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-8 text-center">
                  <span className="bg-white/90 backdrop-blur-md text-neutral-900 text-xs font-bold py-1.5 px-4 rounded-xl inline-block shadow-sm">
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
