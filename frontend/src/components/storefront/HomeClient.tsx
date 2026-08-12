'use client';

import React, { useState, useEffect } from 'react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

// 11 Sections
import { HeroSection } from '@/components/storefront/HeroSection'; // Section 02
import { CategoryCircles } from '@/components/storefront/CategoryCircles'; // Section 03
import { PromoBannersSection } from '@/components/storefront/PromoBannersSection'; // Section 03.5: Mobile Promo Banners
import { ProductGridSection } from '@/components/storefront/ProductGridSection'; // Section 04: New Arrivals
import { FeaturedCollections } from '@/components/storefront/FeaturedCollections'; // Section 06
import { TestimonialsSection } from '@/components/storefront/TestimonialsSection'; // Section 07
import { InstagramFeed } from '@/components/storefront/InstagramFeed'; // Section 08
import { WhyChooseUs } from '@/components/storefront/WhyChooseUs'; // Section 09
import { NewsletterSection } from '@/components/storefront/NewsletterSection'; // Section 10

import { ChevronUp } from 'lucide-react';
import { useCustomerProducts } from '@/features/customer/hooks';

export function HomeClient() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { data: newArrivals, isLoading: loadingNew } = useCustomerProducts({
    isNewArrival: true,
    limit: 12,
  });
  const { data: featured } = useCustomerProducts({
    isFeatured: true,
    limit: 12,
  });

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const newArrivalsList = Array.isArray(newArrivals) ? newArrivals : Array.isArray((newArrivals as { items?: unknown[] })?.items) ? (newArrivals as { items?: unknown[] }).items! : [];
  const featuredList = Array.isArray(featured) ? featured : Array.isArray((featured as { items?: unknown[] })?.items) ? (featured as { items?: unknown[] }).items! : [];
  const newItems = newArrivalsList.length ? newArrivalsList : featuredList;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-neutral-900 selection:bg-rose-100 selection:text-[#800020]">
      
      {/* 01 HEADER */}
      <StorefrontHeader />

      <main className="flex-1 space-y-2 sm:space-y-4">
        {/* 02 HERO SECTION */}
        <HeroSection />

        {/* 03 CATEGORY SECTION */}
        <CategoryCircles />

        {/* 03.5 PROMO BANNERS (Mobile Side-Scrolling) */}
        <PromoBannersSection />

        {/* 04 NEW ARRIVALS */}
        <ProductGridSection
          title="New Arrivals"
          subtitle={
            loadingNew
              ? 'Loading latest styles…'
              : 'Handpicked latest styles for you'
          }
          products={newItems.map((pItem) => {
            const p = pItem as Record<string, unknown>;
            return {
              id: String(p.id || ''),
              brand: String(p.brand || 'Vasanthi Designers'),
              title: String(p.title || p.name || ''),
              price: Number(p.price || p.salePrice || 0),
              originalPrice: Number(p.originalPrice || p.basePrice || 0),
              discount: String(p.discount || ''),
              rating: Number(p.rating || 5),
              reviewsCount: Number(p.reviewsCount || 0),
              image: String(p.image || p.primaryImageUrl || ''),
              isNew: true,
            };
          })}
          viewAllHref="/categories/new-arrivals"
        />

        {/* 05 COLLECTIONS BANNER */}
        <FeaturedCollections />

        {/* 06 TESTIMONIALS */}
        <TestimonialsSection />

        {/* 07 INSTAGRAM FEED (REELS) */}
        <InstagramFeed />

        {/* 08 BEST SELLERS (Under Instagram Reels) */}
        <ProductGridSection
          title="Best Sellers"
          subtitle="Top rated customer favorites"
          products={(featuredList.length > 0 ? featuredList : newItems).map((pItem) => {
            const p = pItem as Record<string, unknown>;
            return {
              id: String(p.id || ''),
              brand: String(p.brand || 'Vasanthi Designers'),
              title: String(p.title || p.name || ''),
              price: Number(p.price || p.salePrice || 0),
              originalPrice: Number(p.originalPrice || p.basePrice || 0),
              discount: String(p.discount || ''),
              rating: Number(p.rating || 5),
              reviewsCount: Number(p.reviewsCount || 0),
              image: String(p.image || p.primaryImageUrl || ''),
              isBestSeller: true,
              isNew: false,
            };
          })}
          viewAllHref="/categories/best-sellers"
        />

        {/* 09 WHY CHOOSE US */}
        <WhyChooseUs />

        {/* 10 NEWSLETTER */}
        <NewsletterSection />
      </main>

      {/* 11 FOOTER */}
      <StorefrontFooter />
      <MobileBottomNav />

      {/* Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 md:bottom-8 right-6 z-40 w-11 h-11 rounded-full bg-[#800020] hover:bg-[#600018] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 border border-white/20"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
