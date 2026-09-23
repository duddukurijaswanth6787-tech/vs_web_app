'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCmsPage } from '@/features/customer/hooks';

export default function AboutPage() {
  const { data, isLoading } = useCmsPage('about');

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Heritage &amp; Passion</span>
            <h1 className="text-xl font-bold font-serif text-[var(--brand-primary)]">
              {data?.title || 'Our Story'}
            </h1>
          </div>
        </div>
        <Link
          href="/collections"
          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
        >
          View Collection
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-10 flex-1 space-y-8">
        {isLoading ? (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-12 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-neutral-200 border-t-[var(--brand-primary)] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-neutral-400 font-medium">Loading Our Story…</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-12 shadow-sm overflow-hidden">
            {data?.content ? (
              <div
                className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed text-sm sm:text-base space-y-4 font-serif"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            ) : (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-serif">
                  ❖
                </div>
                <h2 className="text-2xl font-bold font-serif text-neutral-900">Our Story</h2>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  The story content and image will appear here. You can customize this anytime from the Super Admin panel under <span className="font-semibold text-neutral-800">CMS &gt; Pages &gt; Our Story</span>.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
