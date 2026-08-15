'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MobileScrollSection } from '@/components/layout/MobileScrollSection';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

const COLLECTIONS = [
  { name: 'Anarkali', slug: 'anarkali', image: PLACEHOLDER_IMAGE },
  { name: 'Sharara', slug: 'sharara', image: PLACEHOLDER_IMAGE },
  { name: 'Kurta Set', slug: 'kurta-set', image: PLACEHOLDER_IMAGE },
  { name: 'Saree', slug: 'saree', image: PLACEHOLDER_IMAGE },
  { name: 'Lehenga', slug: 'lehenga', image: PLACEHOLDER_IMAGE },
];

function CollectionCard({ item }: { item: typeof COLLECTIONS[0] }) {
  return (
    <Link
      href={`/categories/${item.slug}`}
      prefetch={false}
      className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-100 shadow-2xs hover:shadow-md transition-all duration-300 border border-neutral-200/60 w-[140px] sm:w-48 lg:w-full shrink-0 snap-start"
    >
      <Image
        src={withVariant(item.image, 'medium')}
        alt={item.name}
        fill
        sizes="(max-width: 640px) 40vw, 20vw"
        unoptimized={isLocalOrPlaceholder(item.image)}
        className="object-cover group-hover:scale-108 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300" />
      <div className="absolute bottom-3 left-3 right-3 text-left space-y-0.5 z-10">
        <h3 className="text-sm font-bold font-serif text-white tracking-wide drop-shadow-sm">
          {item.name}
        </h3>
        <p className="text-[10px] text-rose-200 font-semibold uppercase tracking-widest drop-shadow-xs">
          Collection
        </p>
      </div>
    </Link>
  );
}

export function FeaturedCollections() {

  return (
    <section className="w-full max-w-[1440px] mx-auto py-4 sm:py-8">
      {/* Header (Hidden on Mobile, Visible on Desktop/Tablet) */}
      <div className="hidden sm:flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 px-4 sm:px-8 lg:px-12">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#800020] uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Trending Collections
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-neutral-900 tracking-tight pt-1">
            Styles That Everyone Is Loving Right Now!
          </h2>
        </div>
        <Link
          href="/categories"
          prefetch={false}
          className="inline-flex items-center justify-center bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-xs transition-all hover:scale-105 shrink-0 self-start md:self-auto"
        >
          <span>Explore Collection</span>
          <span className="ml-1">→</span>
        </Link>
      </div>

      {/* Mobile Scroll Section */}
      <MobileScrollSection title="Trending Collections">
        {COLLECTIONS.map((item) => (
          <CollectionCard key={item.slug} item={item} />
        ))}
      </MobileScrollSection>

      {/* Desktop Grid Section */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-5 px-12">
        {COLLECTIONS.map((item) => (
          <CollectionCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}
