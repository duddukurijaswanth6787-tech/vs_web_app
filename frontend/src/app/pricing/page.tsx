'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCmsPage } from '@/features/customer/hooks';

export default function PricingPage() {
  const { data, isLoading } = useCmsPage('pricing');
  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Pricing</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        {/* Policy Content (editable by admin from Storefront > Content > Pages) */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          {isLoading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: data?.content || '' }} />
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/categories" className="bg-[var(--brand-primary)] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[var(--brand-primary-dark)]">
            Browse All Products
          </Link>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
