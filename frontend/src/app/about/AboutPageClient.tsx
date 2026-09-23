'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCmsPage } from '@/features/customer/hooks';

export default function AboutPage() {
  const { data, isLoading } = useCmsPage('about');
  const storyImage = 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/brand/our-story.jpg';

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Heritage &amp; Couture</span>
            <h1 className="text-xl font-bold font-serif text-[var(--brand-primary)]">
              {data?.title || 'Our Story'}
            </h1>
          </div>
        </div>
        <Link
          href="/collections"
          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
        >
          Explore Collection
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1">
        {isLoading ? (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-16 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-neutral-200 border-t-[var(--brand-primary)] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-neutral-400 font-medium">Loading Our Story…</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Brand Story Image */}
              <div className="lg:col-span-5 w-full">
                <div className="relative rounded-2xl overflow-hidden shadow-md border border-amber-900/10 bg-neutral-100 aspect-[4/5] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={storyImage}
                    alt="Vasanthi's Signature - Our Story"
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Vasanthi&apos;s Signature</p>
                    <p className="text-xs font-serif opacity-90">Crafted with Heritage &amp; Elegance</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Story Text (Editable in Super Admin) */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block mb-3">
                    The Artisan Legacy
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-neutral-900 tracking-tight leading-tight">
                    {data?.title || 'Our Story'}
                  </h2>
                </div>

                {data?.content && data.content.trim().length > 0 ? (
                  <div
                    className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed text-sm sm:text-base space-y-4 font-serif"
                    dangerouslySetInnerHTML={{ __html: data.content }}
                  />
                ) : (
                  <div className="space-y-4 text-neutral-600 font-serif leading-relaxed text-sm sm:text-base bg-neutral-50/60 border border-dashed border-neutral-300 rounded-2xl p-6">
                    <p className="font-sans text-xs text-amber-800 font-medium">
                      💡 <strong>Super Admin Note:</strong> You can write and edit this story text anytime in your Super Admin panel under{' '}
                      <Link href="/admin/cms/pages" className="underline font-bold text-neutral-900">
                        CMS &gt; Pages &gt; Our Story
                      </Link>.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-4">
                  <Link
                    href="/collections"
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-xs"
                  >
                    Explore Our Collections
                  </Link>
                  <Link
                    href="/contact"
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold px-6 py-3 rounded-xl transition"
                  >
                    Contact Boutique
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
