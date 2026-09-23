'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  Globe, 
  Heart, 
  Gem, 
  Award, 
  Feather,
  CheckCircle2
} from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCmsPage } from '@/features/customer/hooks';

export default function AboutPage() {
  const { data, isLoading } = useCmsPage('about');
  const storyImage = 'https://vasanthi-signature-images.s3.ap-south-2.amazonaws.com/brand/our-story.jpg';

  return (
    <div className="min-h-screen bg-[#FCFAF6] flex flex-col font-sans antialiased text-neutral-900 pb-20 relative overflow-x-hidden">
      {/* Decorative CSS Styles for Golden Glows and Shimmer Sweeps */}
      <style jsx global>{`
        @keyframes goldShimmer {
          0% { transform: translateX(-100%) rotate(25deg); opacity: 0; }
          20% { opacity: 0.6; }
          40% { transform: translateX(200%) rotate(25deg); opacity: 0; }
          100% { transform: translateX(200%) rotate(25deg); opacity: 0; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.04); }
        }
        .animate-shimmer-sweep {
          animation: goldShimmer 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Top Luxury Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-900/10 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl hover:bg-amber-50 text-neutral-700 transition flex items-center gap-1.5 text-xs font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 text-amber-800 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Boutique</span>
          </Link>
          <div className="h-5 w-px bg-neutral-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-800">
              <Crown className="w-3 h-3 text-amber-600" />
              <span>Heritage &amp; Haute Couture</span>
            </div>
            <h1 className="text-xl font-bold font-serif text-[var(--brand-primary)]">
              {data?.title || 'Our Story'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60">
            <Sparkles className="w-3 h-3 text-amber-700 animate-pulse" />
            <span className="text-xs font-serif italic text-amber-900 font-medium">
              “Royal Elegance In Every Weave”
            </span>
          </div>
        </div>
      </header>

      {/* Hero Royal Accent Banner */}
      <div className="w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 py-3 px-4 shadow-inner relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs font-serif tracking-widest uppercase">
          <span className="text-amber-400">✦</span>
          <span className="text-amber-200 font-medium text-[11px] sm:text-xs">
            Handcrafted with Passion &bull; Pure Silk Certified &bull; Bespoke Bridal Atelier
          </span>
          <span className="text-amber-400">✦</span>
        </div>
      </div>

      {/* Main Luxury Content Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1 space-y-12">
        {isLoading ? (
          <div className="bg-white border border-amber-900/10 rounded-3xl p-16 text-center shadow-xs">
            <div className="w-12 h-12 border-3 border-amber-200 border-t-amber-800 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-amber-900/70 font-medium font-serif">Unfolding the Story of Vasanthi&apos;s Signature…</p>
          </div>
        ) : (
          <>
            {/* 1. Main Showcase Card */}
            <div className="bg-white border border-amber-900/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_25px_60px_rgba(180,83,9,0.08)] relative overflow-hidden">
              {/* Background Ambient Radial Glow */}
              <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              
              {/* Background Luxury Watermark Motif */}
              <div className="absolute top-4 right-4 text-amber-900/[0.03] font-serif text-[240px] select-none pointer-events-none leading-none">
                ❖
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
                {/* ── Left Column: Ornate Animated Image Frame ── */}
                <div className="lg:col-span-5 w-full flex justify-center">
                  <div className="relative w-full max-w-md group animate-float-slow">
                    {/* Pulsing Golden Aura Glow behind the frame */}
                    <div className="absolute -inset-3 bg-gradient-to-tr from-amber-600/30 via-yellow-500/25 to-amber-700/20 rounded-3xl blur-2xl animate-pulse-glow" />

                    {/* Dual-tone Regal Gold Outer Border Framing */}
                    <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-amber-300 via-amber-100 to-amber-500 rounded-3xl shadow-2xl border border-amber-400/50 transition duration-500 group-hover:shadow-[0_20px_50px_rgba(217,119,6,0.35)]">
                      
                      {/* Decorative Gold Filigree Corner Ornaments */}
                      <div className="absolute top-1 left-1 w-6 h-6 border-t-3 border-l-3 border-amber-700 rounded-tl-lg pointer-events-none z-20" />
                      <div className="absolute top-1 right-1 w-6 h-6 border-t-3 border-r-3 border-amber-700 rounded-tr-lg pointer-events-none z-20" />
                      <div className="absolute bottom-1 left-1 w-6 h-6 border-b-3 border-l-3 border-amber-700 rounded-bl-lg pointer-events-none z-20" />
                      <div className="absolute bottom-1 right-1 w-6 h-6 border-b-3 border-r-3 border-amber-700 rounded-br-lg pointer-events-none z-20" />

                      {/* Top Centered Royal Seal Emblem */}
                      <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1.5 z-20 border border-amber-300">
                        <Crown className="w-3 h-3 text-amber-300" />
                        <span>Master Couturier</span>
                      </div>

                      {/* Inner Pristine Image Container */}
                      <div className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-[3/4] shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={storyImage}
                          alt="Vasanthi's Signature - Founder & Designer"
                          className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-108"
                        />

                        {/* Animated Gold Shimmer Light Sweep Overlay */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/25 to-transparent transform -rotate-45 -translate-y-1/4 animate-shimmer-sweep" />
                        </div>

                        {/* Elegant Vignette Shadow */}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent pointer-events-none" />

                        {/* Gold Inner Edge Line */}
                        <div className="absolute inset-2 border border-amber-400/30 rounded-xl pointer-events-none" />

                        {/* Glassmorphic Founder Title Card */}
                        <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-neutral-950/60 backdrop-blur-md border border-white/20 rounded-xl p-3.5 text-white shadow-xl pointer-events-none transform transition-transform duration-500 group-hover:-translate-y-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-400 text-sm">❖</span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-serif">
                                Vasanthi&apos;s Signature
                              </span>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 font-semibold uppercase">
                              Est. Heritage
                            </span>
                          </div>
                          <p className="text-xs font-serif font-medium text-neutral-100 tracking-wide">
                            Founder &amp; Creative Couturier
                          </p>
                          <p className="text-[10px] text-amber-200/80 italic font-serif mt-0.5">
                            Crafted with Heritage &amp; Elegance
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Story Text & Philosophy ── */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="h-0.5 w-8 bg-amber-700" />
                      <span className="text-xs uppercase tracking-widest font-bold text-amber-800">
                        The Artisan Legacy
                      </span>
                      <span className="text-amber-600 text-xs">✦</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl lg:text-4xl font-bold font-serif text-neutral-900 tracking-tight leading-tight">
                      {data?.title || 'Our Story'}
                    </h2>
                    <p className="text-xs text-amber-900/80 font-serif italic mt-1">
                      Woven from the loom of tradition, tailored for modern royalty.
                    </p>
                  </div>

                  {/* Dynamic Super Admin Content */}
                  {data?.content && data.content.trim().length > 0 ? (
                    <div
                      className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed text-sm sm:text-base space-y-4 font-serif"
                      dangerouslySetInnerHTML={{ __html: data.content }}
                    />
                  ) : (
                    <div className="space-y-4 text-neutral-700 font-serif leading-relaxed text-sm sm:text-base bg-amber-50/50 border border-dashed border-amber-300/80 rounded-2xl p-6 relative">
                      <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-amber-800 first-letter:mr-2 first-letter:float-left leading-relaxed">
                        At <strong className="font-semibold text-neutral-900">Vasanthi&apos;s Signature</strong>, every ensemble is an heirloom masterwork rooted in pure Indian handlooms, timeless zardosi embroidery, and bespoke bridal couture. We celebrate the timeless artistry of master weavers, translating ancestral heritage into modern elegance.
                      </p>
                      <p>
                        Each saree, lehenga, and couture creation is meticulously crafted with hand-selected pure mulberry silk, tested zari, and painstaking craftsmanship to ensure you radiate poise on your most memorable celebrations.
                      </p>
                      
                      <div className="font-sans text-xs text-amber-900 font-medium pt-3 border-t border-amber-200/80 flex items-center justify-between">
                        <span>
                          💡 <strong>Super Admin Note:</strong> Write and personalize your story anytime via{' '}
                          <Link href="/admin/cms/pages" className="underline font-bold text-amber-950 hover:text-amber-800">
                            CMS &gt; Pages &gt; Our Story
                          </Link>.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Founder Stamp & Quote Box */}
                  <div className="pt-6 border-t border-amber-900/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/30 p-4 rounded-2xl border border-amber-900/5">
                    <div className="space-y-1">
                      <p className="font-serif italic text-amber-950 font-semibold text-sm sm:text-base">
                        “Where royal heritage meets timeless fashion.”
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-800 uppercase tracking-widest font-sans font-bold">
                          — Vasanthi Duddukuri
                        </span>
                        <span className="text-neutral-400 text-xs">&bull;</span>
                        <span className="text-[11px] text-neutral-500 font-serif">Founder &amp; Designer</span>
                      </div>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm shrink-0 border border-amber-500/40">
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>Handcrafted Atelier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Brand Heritage Pillars Strip */}
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                  ❖ Uncompromising Excellence ❖
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-neutral-900">
                  The Pillars of Vasanthi&apos;s Signature
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-amber-900/10 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-amber-400/50 transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-neutral-900 text-base mb-1.5">Authentic Handlooms</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                    Crafted on traditional pit looms with pure mulberry silk and authentic zari tested for generational longevity.
                  </p>
                </div>

                <div className="bg-white border border-amber-900/10 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-amber-400/50 transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-neutral-900 text-base mb-1.5">Bespoke Bridal Couture</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                    Intricate hand zardosi, cutwork, and customized maggam embroidery tailored precisely to your silhouette.
                  </p>
                </div>

                <div className="bg-white border border-amber-900/10 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-amber-400/50 transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-neutral-900 text-base mb-1.5">Silk Mark Certified</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                    100% genuine pure silk assurance with government recognized Silk Mark verification for every weave.
                  </p>
                </div>

                <div className="bg-white border border-amber-900/10 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-amber-400/50 transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-neutral-900 text-base mb-1.5">Global Courier Delivery</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                    Insured express door delivery with real-time tracking for couture lovers across the globe.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. The Craftsmanship Journey (Bottom Visual Milestones) */}
            <div className="bg-gradient-to-br from-amber-900 via-amber-950 to-neutral-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                <div className="max-w-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-widest">
                    <Feather className="w-4 h-4 text-amber-400" />
                    <span>Artisan Process</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                    The Art of Haute Couture Creation
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 font-serif leading-relaxed">
                    From yarn spinning to the final embroidery finish, every single thread passes through master artisan hands.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-amber-800/40">
                  <div className="space-y-2">
                    <span className="text-2xl font-serif font-bold text-amber-400">01</span>
                    <h5 className="font-serif font-semibold text-white text-sm">Yarn &amp; Silk Sourcing</h5>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      Finest grade mulberry and raw Kanchipuram silk fibers selected for luster and softness.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-2xl font-serif font-bold text-amber-400">02</span>
                    <h5 className="font-serif font-semibold text-white text-sm">Traditional Loom Weaving</h5>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      Intertwined with authentic tested zari using generational pit-loom techniques.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-2xl font-serif font-bold text-amber-400">03</span>
                    <h5 className="font-serif font-semibold text-white text-sm">Zardosi &amp; Aari Detailing</h5>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      Hundreds of hours of hand-guided zardosi, pearls, and cut-dana embellishments.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-2xl font-serif font-bold text-amber-400">04</span>
                    <h5 className="font-serif font-semibold text-white text-sm">Couture Perfection</h5>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      Rigorous quality audit and bespoke packaging before reaching your doorstep.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Storefront Footer & Navigation */}
      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
