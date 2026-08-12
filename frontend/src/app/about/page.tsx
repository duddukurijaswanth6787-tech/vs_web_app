'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, Award, MapPin } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Our Story</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#42101F] via-[#2D0812] to-[#150207] text-white rounded-3xl p-6 sm:p-10 space-y-4 shadow-md text-center sm:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 font-serif text-9xl select-none pointer-events-none">❖</div>
          <span className="text-xs uppercase tracking-widest font-bold text-amber-300">HAUTE COUTURE SAREES & LUXURY FASHION</span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white tracking-tight leading-tight">
            Vasanthi&apos;s Signature
          </h2>
          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed max-w-2xl">
            Established in 2018, Vasanthi&apos;s Signature represents the pinnacle of South Indian heritage weaving, regal zardosi embroidery, and timeless bridal couture.
          </p>
        </div>

        {/* Brand Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#800020]">Artisanal Heritage</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every saree and lehenga is handcrafted by master artisans using traditional looms, real zari threads, and pure mulberry silk.
            </p>
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#800020]">Uncompromising Quality</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Silk Mark certified pure silks and rigorously inspected couture garments designed to be treasured across generations.
            </p>
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center font-bold">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#800020]">Bespoke Bridal Atelier</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Custom color matching, tailored hand-embroidery, and personalized styling consultations for brides across the globe.
            </p>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-xl font-serif font-bold text-[#800020]">The Craft & Legacy</h3>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
            At Vasanthi&apos;s Signature, we believe sarees are more than just garments—they are hand-woven tapestries of culture, love, and celebration. From classic Kanchipuram weaves to modern designer organza, our collections bridge classical royal aesthetics with modern elegance.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/categories/sarees" className="bg-[#800020] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#600018]">
              Explore Sarees
            </Link>
            <Link href="/stores" className="border border-neutral-300 text-neutral-800 text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-50 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#800020]" />
              <span>Visit Our Flagship Store</span>
            </Link>
          </div>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
