'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  ctaEnabled?: boolean;
  ctaStyle?: 'solid' | 'transparent';
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
    subtitle: 'Celebrate every moment in haute couture dresses & designer Anarkali suits.',
    imageUrl: PLACEHOLDER_IMAGE,
    linkUrl: '/categories/ethnic-wear',
    buttonText: 'EXPLORE COLLECTION',
  },
];

export function HeroSection() {
  const { data } = useStorefrontBanners();
  const banners: Banner[] = useMemo(() => {
    const typedData = data as { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>> | undefined;
    const list = Array.isArray(typedData) ? typedData : typedData?.data || [];
    if (list.length > 0) {
      return list.map((b: Record<string, unknown>) => {
        const rawDesktopImg = (b.imageUrl as string) || (b.image as string) || '';
        const resolvedDesktop = rawDesktopImg ? resolveMediaUrl(rawDesktopImg) : '';

        const rawMobileImg = (b.mobileImageUrl as string) || (b.mobileImage as string) || '';
        const resolvedMobile = rawMobileImg ? resolveMediaUrl(rawMobileImg) : '';

        return {
          id: String(b.id || ''),
          title: String(b.title || ''),
          subtitle: String(b.description || b.subtitle || ''),
          buttonText: String(b.ctaText || 'SHOP NOW'),
          linkUrl: String(b.ctaLink || b.linkUrl || '/catalog'),
          imageUrl: resolvedDesktop || PLACEHOLDER_IMAGE,
          mobileImageUrl: resolvedMobile || undefined,
          badge: String(b.badge || 'New Collection'),
          color: String(b.color || '#1769D2'),
          ctaEnabled: b.ctaEnabled !== false,
          ctaStyle: b.ctaStyle === 'transparent' ? ('transparent' as const) : ('solid' as const),
        };
      });
    }
    return DEFAULT_SLIDES;
  }, [data]);

  const [index, setIndex] = useState(0);
  const { data: settings } = usePublicSettings();
  const typedSettings = settings as Record<string, unknown> | undefined;
  const autoplayEnabled = (typedSettings?.bannerAutoplayEnabled as boolean | undefined) ?? true;
  const autoplayInterval = Number(typedSettings?.bannerAutoplayInterval) || 6;

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

  const isDefaultSlide = banners === DEFAULT_SLIDES || (banners.length === 2 && banners[0].id === 's1');
  const rawTitle = main.title?.trim() || '';
  const rawSubtitle = main.subtitle?.trim() || '';

  // Only consider text valid if explicitly provided, or if using fallback default slides
  const hasTitle = isDefaultSlide
    ? Boolean(rawTitle && !rawTitle.includes('COLLECTION'))
    : Boolean(rawTitle.length > 0);
  const hasSubtitle = isDefaultSlide
    ? Boolean(rawSubtitle.length > 0)
    : Boolean(rawSubtitle.length > 0);
  const showCta = main.ctaEnabled !== false && Boolean(main.buttonText);
  const hasTextOverlay = hasTitle || hasSubtitle || showCta;

  const hasMobileImage = Boolean(main.mobileImageUrl);
  const isExternalLink = main.linkUrl?.startsWith('http://') || main.linkUrl?.startsWith('https://');

  const bannerImagesContent = (
    <>
      {/* Mobile Banner Image (Shown on <640px) */}
      <div className="block sm:hidden w-full h-full relative">
        <Image
          src={withVariant(main.mobileImageUrl || main.imageUrl || PLACEHOLDER_IMAGE, 'large')}
          alt={main.title || 'Hero Banner'}
          fill
          priority
          sizes="100vw"
          unoptimized={isLocalOrPlaceholder(main.mobileImageUrl || main.imageUrl)}
          className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
        />
      </div>

      {/* Desktop Banner Image (Shown on >=640px) */}
      <div className="hidden sm:block w-full h-full relative">
        <Image
          src={withVariant(main.imageUrl || PLACEHOLDER_IMAGE, 'large')}
          alt={main.title || 'Hero Banner'}
          fill
          priority
          sizes="100vw"
          unoptimized={isLocalOrPlaceholder(main.imageUrl)}
          className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
        />
      </div>

      {/* Scrim overlay ONLY when text is actually present */}
      {hasTextOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 from-0% via-black/20 via-35% to-transparent to-60% sm:bg-gradient-to-r sm:from-white/95 sm:via-white/70 sm:to-transparent sm:from-0% sm:via-50% sm:to-100% z-10" />
      )}
    </>
  );

  return (
    <section className="w-full px-2 sm:px-6 lg:px-8 py-1 sm:py-3">
      <div className="w-full max-w-[1920px] mx-auto">
        <div
          className={`relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs sm:shadow-sm bg-[#EAF4FF] group ${
            hasMobileImage ? 'aspect-[16/10] sm:aspect-[12/5]' : 'aspect-[12/5]'
          }`}
        >
          {/* Background Image & Clickable Redirect Link */}
          {isExternalLink ? (
            <a
              href={main.linkUrl}
              className="absolute inset-0 z-10 block"
              aria-label={main.title || 'Featured Banner'}
              target="_blank"
              rel="noopener noreferrer"
            >
              {bannerImagesContent}
            </a>
          ) : (
            <Link
              href={main.linkUrl || '/categories'}
              className="absolute inset-0 z-10 block"
              aria-label={main.title || 'Featured Banner'}
            >
              {bannerImagesContent}
            </Link>
          )}

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

          {/* Hero Content Overlay - Only rendered if Title, Subtitle, or CTA is present */}
          {hasTextOverlay && (
            <div className="absolute bottom-4 sm:bottom-12 left-4 sm:left-12 z-20 text-left max-w-full sm:max-w-lg space-y-0.5 sm:space-y-3.5 pb-1 sm:pb-0 pointer-events-none">
              {hasTitle && (
                <h1 className="text-[26px] sm:text-4xl lg:text-5xl font-black font-serif text-neutral-900 leading-[1.15] tracking-tight line-clamp-3">
                  {main.title}
                </h1>
              )}

              {hasSubtitle && (
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-snug line-clamp-2 max-w-[90%] sm:max-w-md">
                  {main.subtitle}
                </p>
              )}

              {/* Primary CTA Button */}
              {showCta && (
                <div className="pt-0.5 sm:pt-2 flex justify-start pointer-events-auto">
                  <Link
                    href={main.linkUrl || '/categories'}
                    className={
                      main.ctaStyle === 'transparent'
                        ? 'inline-flex items-center justify-center bg-transparent border-2 border-[#1769D2] text-[#1769D2] hover:bg-[#1769D2] hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-2 sm:px-7 sm:py-2.5 rounded-lg sm:rounded-xl transition-all hover:scale-105'
                        : 'inline-flex items-center justify-center bg-[#1769D2] hover:bg-[var(--brand-primary-dark)] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-2.5 sm:px-7 sm:py-3 rounded-lg sm:rounded-xl shadow-xs transition-all hover:scale-105'
                    }
                  >
                    {main.buttonText || 'SHOP NOW'}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Dot Pagination Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
              {banners.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 sm:w-6 bg-[#1769D2]' : 'w-1.5 sm:w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
