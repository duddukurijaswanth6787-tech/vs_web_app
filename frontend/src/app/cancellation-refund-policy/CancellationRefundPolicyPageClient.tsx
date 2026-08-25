'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCmsPage } from '@/features/customer/hooks';

export default function CancellationRefundPolicyPage() {
  const { data, isLoading } = useCmsPage('cancellation-refund-policy');
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <Link href="/" className="hover:text-[#0284c7] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span>/</span>
          <span className="text-[#0284c7]">Cancellation & Refund Policy</span>
        </div>

        {/* Page Hero Header */}
        <div className="bg-gradient-to-br from-sky-950 via-[#420A18] to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <RefreshCw className="w-4 h-4" /> Cancellations, Returns & Refunds
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight">Cancellation & Refund Policy</h1>
            <p className="text-xs sm:text-sm text-sky-100/80 max-w-2xl leading-relaxed">
              How order cancellations, returns, and refunds work at <strong className="text-amber-300">Vasanthi&apos;s Signature</strong>.
            </p>
          </div>
        </div>

        {/* Policy Content (editable by admin from Storefront > Content > Pages) */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
          {isLoading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: data?.content || '' }} />
          )}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
