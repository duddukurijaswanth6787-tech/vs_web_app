'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function StorefrontNotFound() {
  return (
    <div suppressHydrationWarning className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-20 lg:pb-0">
      
      {/* Header */}
      <header suppressHydrationWarning className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/" className="p-1 text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold font-serif text-[#0284c7] tracking-tight">
          Vasanthi&apos;s Signature
        </h1>
        <div className="w-6" />
      </header>

      {/* Main 440 Error Container */}
      <main suppressHydrationWarning className="max-w-md mx-auto px-4 py-16 flex-1 w-full text-center space-y-6 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-sky-50 text-[#0284c7] flex items-center justify-center mx-auto text-3xl font-extrabold font-serif border border-sky-200">
          404
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-serif text-neutral-900">
            Page Not Found
          </h2>
          <p className="text-xs text-neutral-500 font-medium max-w-xs mx-auto leading-relaxed">
            The page you are looking for might have been removed or is temporarily unavailable.
          </p>
        </div>

        <Link
          href="/"
          className="bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-md flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Storefront Home</span>
        </Link>
      </main>

      {/* Footer */}
      <StorefrontFooter />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

    </div>
  );
}
