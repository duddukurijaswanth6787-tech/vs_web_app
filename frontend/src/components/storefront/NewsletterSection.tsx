'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

const VALID_IMAGE = PLACEHOLDER_IMAGE;

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0B3B78] via-[#1769D2] to-[#1257B5] text-white p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-[#DCEBFA]/40 min-h-[180px]">
        
        {/* Left Content */}
        <div className="space-y-3 max-w-lg z-10 text-center md:text-left">
          <h2 className="text-lg sm:text-3xl font-bold font-serif tracking-tight drop-shadow-xs">
            Stay Updated with Latest Trends & Offers
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
            Subscribe to our newsletter and never miss an update!
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md mx-auto md:mx-0 pt-1">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/95 text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm px-4 py-3 rounded-xl outline-none font-medium border border-blue-200/50 shadow-2xs focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="bg-[#0B3B78] hover:bg-[#072449] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-5 sm:px-6 py-3 rounded-xl transition-all shadow-md shrink-0 hover:scale-105"
            >
              Subscribe
            </button>
          </form>

          {subscribed && (
            <p className="text-xs font-semibold text-emerald-300 animate-fade-in">
              ✓ Thank you for subscribing to Vasanthi Designers!
            </p>
          )}
        </div>

        {/* Right Model Graphic Image */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 hidden md:block z-10 -my-8">
          <Image
            src={withVariant(VALID_IMAGE, 'medium')}
            alt="Newsletter Model"
            fill
            sizes="224px"
            unoptimized={isLocalOrPlaceholder(VALID_IMAGE)}
            className="object-cover object-top rounded-2xl drop-shadow-md border-2 border-white/20"
          />
        </div>

      </div>
    </section>
  );
}
