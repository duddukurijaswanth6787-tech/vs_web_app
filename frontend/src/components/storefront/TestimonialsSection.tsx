'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useFeaturedTestimonials } from '@/features/testimonials/testimonial.hooks';

export function TestimonialsSection() {
  const [, setIndex] = useState(0);
  const { data: dbTestimonials = [], isLoading } = useFeaturedTestimonials();

  const reviews = dbTestimonials;

  const prev = () => setIndex((i) => (i - 1 + reviews.length) % reviews.length);
  const next = () => setIndex((i) => (i + 1) % reviews.length);

  // Hide section cleanly if 0 featured testimonials are in the database
  if (!isLoading && reviews.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight">
            What Our Customers Say
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reviews"
            className="text-xs sm:text-sm font-bold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>View All Reviews</span>
            <span>→</span>
          </Link>
          {reviews.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={prev}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-all"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-all"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Testimonial Cards: Side-scrolling on Mobile, Grid on Desktop */}
      {isLoading ? (
        <div className="flex overflow-x-auto gap-4 pb-3 pt-1 scrollbar-none md:grid md:grid-cols-3 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-100 rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-3 pt-1 scrollbar-none snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6">
          {reviews.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3 relative flex flex-col justify-between hover:shadow-md transition-all w-[280px] sm:w-[320px] md:w-auto shrink-0 snap-start"
            >
              <Quote className="w-8 h-8 text-sky-100 absolute top-4 right-4 -z-0" />

              <div className="space-y-2.5 z-10 relative">
                {/* Star Rating */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-neutral-700 font-medium italic leading-relaxed">
                  &quot;{item.comment}&quot;
                </p>
              </div>

              {/* Author */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between z-10">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">— {item.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-medium">{item.location || item.role || 'Verified Customer'}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {item.role || 'Verified Buyer'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
