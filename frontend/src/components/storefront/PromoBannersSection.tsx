'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

export function PromoBannersSection() {
  return (
    <section className="w-full max-w-[1440px] mx-auto py-4 sm:py-4 lg:hidden">
      <div className="flex overflow-x-auto gap-3.5 px-4 sm:px-6 pb-2.5 pt-1 scrollbar-none snap-x snap-mandatory">
        {/* Festive Collection Promo Card */}
        <div className="w-[85vw] max-w-[340px] sm:w-[360px] shrink-0 snap-start bg-[#FAF3F3] rounded-3xl p-4 sm:p-5 border border-rose-100/80 shadow-2xs flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1.5 max-w-[62%] z-10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#800020] bg-rose-100/80 px-2 py-0.5 rounded-md">
              FOR YOUR SPECIAL DAY
            </span>
            <h3 className="text-base sm:text-lg font-bold font-serif text-neutral-900 leading-tight">
              Festive Collection
            </h3>
            <p className="text-[11px] text-neutral-600 font-medium line-clamp-2 leading-relaxed">
              Brighten every celebration with luxurious ethnic suits.
            </p>
            <Link
              href="/categories/festive"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#800020] hover:underline pt-1"
            >
              <span>Explore Now</span>
              <span>→</span>
            </Link>
          </div>

          <div className="w-24 h-32 sm:w-28 sm:h-36 relative shrink-0 rounded-2xl overflow-hidden shadow-xs border border-white">
            <Image
              src={withVariant(PLACEHOLDER_IMAGE, 'medium')}
              alt="Festive Collection"
              fill
              sizes="120px"
              unoptimized={isLocalOrPlaceholder(PLACEHOLDER_IMAGE)}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Wedding Collection Promo Card */}
        <div className="w-[85vw] max-w-[340px] sm:w-[360px] shrink-0 snap-start bg-[#FAF3F3] rounded-3xl p-4 sm:p-5 border border-rose-100/80 shadow-2xs flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1.5 max-w-[62%] z-10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#800020] bg-rose-100/80 px-2 py-0.5 rounded-md">
              FOR YOUR SPECIAL DAY
            </span>
            <h3 className="text-base sm:text-lg font-bold font-serif text-neutral-900 leading-tight">
              Wedding Collection
            </h3>
            <p className="text-[11px] text-neutral-600 font-medium line-clamp-2 leading-relaxed">
              Elegant sarees, lehengas & designer outfits for unforgettable moments.
            </p>
            <Link
              href="/categories/wedding"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#800020] hover:underline pt-1"
            >
              <span>Explore Now</span>
              <span>→</span>
            </Link>
          </div>

          <div className="w-24 h-32 sm:w-28 sm:h-36 relative shrink-0 rounded-2xl overflow-hidden shadow-xs border border-white">
            <Image
              src={withVariant(PLACEHOLDER_IMAGE, 'medium')}
              alt="Wedding Collection"
              fill
              sizes="120px"
              unoptimized={isLocalOrPlaceholder(PLACEHOLDER_IMAGE)}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
