'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ThumbsUp, ArrowLeft } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const CUSTOMER_REVIEWS = [
  {
    id: 'r1',
    author: 'Priya Sharma',
    city: 'Hyderabad',
    rating: 5,
    date: 'August 2026',
    title: 'Exquisite Silk Saree & Fast Delivery!',
    content: 'The Kanjeevaram silk saree is absolutely stunning. The zari work is rich and high quality. Received it in 2 days in beautiful packaging.',
    verified: true,
  },
  {
    id: 'r2',
    author: 'Ananya Reddy',
    city: 'Bengaluru',
    rating: 5,
    date: 'August 2026',
    title: 'Perfect Fit Anarkali Kurta Set',
    content: 'Ordered the Floral Anarkali set for a family wedding function. Fabric is super soft rayon and the sizing is true to chart.',
    verified: true,
  },
  {
    id: 'r3',
    author: 'Kavitha Rao',
    city: 'Chennai',
    rating: 5,
    date: 'July 2026',
    title: 'Royal Bridal Lehenga',
    content: 'Heavy embroidered velvet lehenga looks even better in person than the pictures. Wonderful customer care team helped with blouse sizing.',
    verified: true,
  },
  {
    id: 'r4',
    author: 'Sneha Patel',
    city: 'Mumbai',
    rating: 5,
    date: 'July 2026',
    title: 'Gorgeous Organza Saree',
    content: 'Loved the delicate floral print and hand-scalloped border. Very lightweight and easy to drape all day.',
    verified: true,
  },
];

export default function CustomerReviewsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-serif text-[#800020]">Customer Reviews & Stories</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Real feedback from verified Vasanthi Designers shoppers</p>
          </div>
        </div>

        {/* Rating Summary Card */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-3xl font-extrabold text-neutral-900">4.9 <span className="text-sm font-normal text-neutral-500">/ 5.0</span></p>
            <p className="text-xs text-neutral-500">Based on 1,200+ verified purchases</p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#800020]">98%</p>
              <p className="text-[11px] text-neutral-600 font-medium">Satisfaction Rate</p>
            </div>
            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#800020]">100%</p>
              <p className="text-[11px] text-neutral-600 font-medium">Authentic Silk</p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {CUSTOMER_REVIEWS.map((review) => (
            <div key={review.id} className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#800020] text-amber-300 font-serif font-bold text-sm flex items-center justify-center">
                    {review.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      {review.author}
                      {review.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Verified Buyer
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-neutral-400">{review.city} · {review.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#800020]">{review.title}</h3>
              <p className="text-xs text-neutral-700 leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
