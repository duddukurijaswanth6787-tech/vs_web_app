'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Newspaper, Mail } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const PRESS_HIGHLIGHTS = [
  {
    publisher: 'Vogue India',
    title: 'The Modern Bride’s Guide to Heritage Kanchipuram Silks',
    date: 'Autumn Couture Edition 2025',
    snippet: 'Vasanthi’s Signature redefines royal South Indian bridal wear with hand-worked real silver zari weaves.',
  },
  {
    publisher: 'Harper’s Bazaar Bride',
    title: 'Top 10 Indian Couture Houses Preserving Handloom Arts',
    date: 'Spring/Summer 2025',
    snippet: 'A spotlight on the artisanal master weavers and bespoke embroidery studio of Vasanthi’s Signature.',
  },
  {
    publisher: 'The Hindu Luxury',
    title: 'Reviving Ancient Weaves with Contemporary Aesthetics',
    date: 'January 2025',
    snippet: 'How founder Vasanthi brings classic South Indian motifs to the global runway.',
  },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Press & Media</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        <div className="bg-[#2D0812] text-white rounded-3xl p-6 sm:p-8 space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">EDITORIALS & RECOGNITION</span>
          <h2 className="text-2xl font-serif font-bold">In the Spotlight</h2>
          <p className="text-xs text-rose-100/80 leading-relaxed max-w-xl">
            Explore editorial features, fashion week showcases, and press coverage of Vasanthi&apos;s Signature collections.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-serif font-bold text-[#0284c7]">Featured Publications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRESS_HIGHLIGHTS.map((item, idx) => (
              <div key={idx} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs flex flex-col justify-between hover:border-rose-200 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-[#0284c7] uppercase tracking-wider">{item.publisher}</span>
                    <Newspaper className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 leading-snug">{item.title}</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.snippet}</p>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium pt-2 border-t border-neutral-100">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif font-bold text-base text-[#0284c7]">Media & PR Inquiries</h3>
            <p className="text-xs text-neutral-600">For high-res campaign assets, interview requests, or celebrity styling.</p>
          </div>
          <a
            href="mailto:press@vasanthisignature.com"
            className="bg-[#0284c7] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#0B3B78] shrink-0 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>press@vasanthisignature.com</span>
          </a>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
