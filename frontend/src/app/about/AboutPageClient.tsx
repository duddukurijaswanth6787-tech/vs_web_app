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
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Our Story</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0A2138] via-[#051426] to-[#01060F] text-white rounded-3xl p-6 sm:p-10 space-y-4 shadow-md text-center sm:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 font-serif text-9xl select-none pointer-events-none">❖</div>
          <span className="text-xs uppercase tracking-widest font-bold text-amber-300">HAUTE COUTURE SAREES & LUXURY FASHION</span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white tracking-tight leading-tight">
            Vasanthi&apos;s Signature
          </h2>
          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-2xl">
            Established in 2018, Vasanthi&apos;s Signature represents the pinnacle of South Indian heritage weaving, regal zardosi embroidery, and timeless bridal couture.
          </p>
        </div>

        {/* Policy Content (editable by admin from Storefront > Content > Pages) */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          {isLoading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: data?.content || '' }} />
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/collections" className="bg-[var(--brand-primary)] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[var(--brand-primary-dark)]">
            Explore the Collection
          </Link>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
