'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const OPEN_POSITIONS = [
  { title: 'Senior Fashion Designer (Bridal Couture)', location: 'Hyderabad', type: 'Full-Time' },
  { title: 'Master Artisan & Zardosi Specialist', location: 'Hyderabad', type: 'Full-Time' },
  { title: 'Luxury Retail Sales Consultant', location: 'Vijayawada', type: 'Full-Time' },
  { title: 'E-Commerce Merchandiser & Stylist', location: 'Remote / Hyderabad', type: 'Full-Time' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Careers at Vasanthi&apos;s Signature</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        <div className="bg-gradient-to-r from-[#42101F] to-[#2D0812] text-white rounded-3xl p-6 sm:p-8 space-y-3">
          <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">JOIN OUR ATELIER</span>
          <h2 className="text-2xl font-serif font-bold">Shape the Future of Luxury Indian Fashion</h2>
          <p className="text-xs text-rose-100/80 leading-relaxed max-w-xl">
            We are always seeking passionate designers, craftsmen, retail specialists, and digital innovators who share our dedication to perfection.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-serif font-bold text-[#800020]">Current Openings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OPEN_POSITIONS.map((pos, idx) => (
              <div key={idx} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-2 shadow-xs hover:border-rose-200 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">
                  {pos.type} · {pos.location}
                </span>
                <h4 className="font-bold text-sm text-neutral-900">{pos.title}</h4>
                <p className="text-xs text-neutral-500">Collaborate with premier ateliers and high-net-worth clientele.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center space-y-3">
          <Briefcase className="w-8 h-8 mx-auto text-[#800020]" />
          <h3 className="font-serif font-bold text-base text-[#800020]">Don&apos;t see your role?</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Send your resume and portfolio to <span className="font-bold text-neutral-800">careers@vasanthisignature.com</span>. We are always happy to hear from extraordinary talent.
          </p>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
