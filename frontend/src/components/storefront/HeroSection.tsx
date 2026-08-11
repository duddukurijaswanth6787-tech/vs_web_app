'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, Award, Heart, Truck } from 'lucide-react';
import { useStorefrontBanners, usePublicSettings } from '@/features/customer/hooks';
import { isLocalOrPlaceholder, withVariant, resolveMediaUrl } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
  position?: string;
};

const DEFAULT_SLIDES = [
  {
    id: 's1',
    badge: 'NEW ARRIVAL COLLECTION 2026',
    title: 'FRESH STYLES - TIMELESS YOU',
    subtitle: 'Handloomed ethnic wear designed for elegance and unmatched comfort.',
    imageUrl: PLACEHOLDER_IMAGE,
    linkUrl: '/categories/ethnic-wear',
    buttonText: 'SHOP NOW',
  },
  {
    id: 's2',
    badge: 'FESTIVE SPECIAL 2026',
    title: 'LUXURY ETHNIC ELEGANCE',
    subtitle: 'Celebrate every moment in haute couture sarees & designer Anarkali suits.',
    imageUrl: PLACEHOLDER_IMAGE,
    linkUrl: '/categories/sarees',
    buttonText: 'EXPLORE COLLECTION',
  },
];

export function HeroSection() {
  const { data } = useStorefrontBanners();
  const banners: Banner[] = useMemo(() => {
    const list = Array.isArray(data) ? data : data?.data || [];
    if (list.length > 0) {
      return list.map((b: any, index: number) => {
        const rawImg = b.imageUrl || b.mobileImageUrl;
        const resolved = rawImg ? resolveMediaUrl(rawImg) : '';
        const isValid = resolved && !resolved.includes('placehold.co');
        return {
          ...b,
          imageUrl: isValid ? resolved : PLACEHOLDER_IMAGE,
          subtitle: b.description || b.subtitle,
        };
      });
    }
    return DEFAULT_SLIDES;
  }, [data]);

  const [index, setIndex] = useState(0);
  const { data: settings } = usePublicSettings();
  const autoplayEnabled = settings?.bannerAutoplayEnabled ?? true;
  const autoplayInterval = settings?.bannerAutoplayInterval ?? 6;

  useEffect(() => {
    let mounted = true;
    if (!autoplayEnabled || !banners.length || banners.length <= 1) return;
    const timer = setTimeout(() => {
      if (mounted) {
        setIndex((i) => (i + 1) % banners.length);
      }
    }, autoplayInterval * 1000);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [index, autoplayEnabled, autoplayInterval, banners.length]);

  const main = banners[index] || banners[0] || DEFAULT_SLIDES[0];

  const prev = () => setIndex((i) => (banners.length ? (i - 1 + banners.length) % banners.length : 0));
  const next = () => setIndex((i) => (banners.length ? (i + 1) % banners.length : 0));

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        
        {/* LEFT COLUMN: Large Hero Slider (Span 8) */}
        <div className="lg:col-span-8 relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[250px] sm:min-h-[520px] flex items-end p-4 sm:p-12 group shadow-xs sm:shadow-sm border border-rose-100/80 bg-[#FAF3F3]">
          
          {/* Background Image & Gradient Overlay */}
          <Link href={main.linkUrl || '/categories'} className="absolute inset-0 z-0 block">
            <Image
              src={withVariant(main.imageUrl || PLACEHOLDER_IMAGE, 'large')}
              alt={main.title || 'Hero Banner'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              unoptimized={isLocalOrPlaceholder(main.imageUrl)}
              className="object-cover object-center group-hover:scale-103 transition-transform duration-700 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF3F3] via-[#FAF3F3]/80 to-transparent sm:bg-gradient-to-r sm:from-[#FAF3F3]/95 sm:via-[#FAF3F3]/70 sm:to-transparent z-10" />
          </Link>

          {/* Slider Arrow Controls */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-800 items-center justify-center backdrop-blur-xs shadow-md z-30 transition-all border border-neutral-200/60 hover:scale-105"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={next}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-800 items-center justify-center backdrop-blur-xs shadow-md z-30 transition-all border border-neutral-200/60 hover:scale-105"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5 text-neutral-700" />
              </button>
            </>
          )}

          {/* Hero Content Overlay (Bottom-Left Aligned) */}
          <div className="relative z-20 text-left max-w-full sm:max-w-lg space-y-1.5 sm:space-y-3.5 pb-1 sm:pb-0">

            {/* Main Headline */}
            <h1 className="text-base sm:text-4xl lg:text-5xl font-black font-serif text-neutral-900 leading-snug sm:leading-[1.15] tracking-tight line-clamp-2">
              {main.title && !main.title.includes('COLLECTION') ? main.title : 'FRESH STYLES — TIMELESS YOU'}
            </h1>

            <p className="text-[11px] sm:text-sm text-neutral-600 font-medium leading-relaxed line-clamp-2 max-w-xs sm:max-w-md">
              {main.subtitle || 'Discover handloomed sarees, designer lehengas, and Anarkali suits crafted for timeless sophistication.'}
            </p>

            {/* Primary CTA Button (Small sleek on mobile, bottom left) */}
            <div className="pt-1 sm:pt-2 flex justify-start">
              <Link
                href={main.linkUrl || '/categories'}
                className="inline-flex items-center justify-center bg-[#800020] hover:bg-[#600018] text-white text-[11px] sm:text-sm font-bold uppercase tracking-wider px-5 py-2 sm:px-7 sm:py-3 rounded-lg sm:rounded-xl shadow-xs transition-all hover:scale-105"
              >
                {main.buttonText || 'SHOP NOW'}
              </Link>
            </div>
          </div>

          {/* Dot Pagination Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
              {banners.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 sm:w-6 bg-[#800020]' : 'w-1.5 sm:w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}

        </div>


        {/* RIGHT COLUMN: Two Promo Cards Stacked Vertically (Desktop Only, Span 4) */}
        <div className="hidden lg:flex lg:flex-col lg:col-span-4 gap-6 justify-between">
          
          {/* Top Promo Card: Festive Collection */}
          <div className="flex-1 bg-[#FAF3F3] rounded-3xl p-5 sm:p-6 border border-rose-100/80 shadow-2xs flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="space-y-2 max-w-[62%] z-10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#800020] bg-rose-100/80 px-2.5 py-0.5 rounded-md">
                FOR YOUR SPECIAL DAY
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-neutral-900 leading-tight">
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

          {/* Bottom Promo Card: Wedding Collection */}
          <div className="flex-1 bg-[#FAF3F3] rounded-3xl p-5 sm:p-6 border border-rose-100/80 shadow-2xs flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="space-y-2 max-w-[62%] z-10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#800020] bg-rose-100/80 px-2.5 py-0.5 rounded-md">
                FOR YOUR SPECIAL DAY
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-neutral-900 leading-tight">
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

      </div>
    </section>
  );
}
