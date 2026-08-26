'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Sparkles, ChevronRight, Gift } from 'lucide-react';
import { usePendingReviews } from '@/features/customer/hooks';
import { ReviewFormModal } from './ReviewFormModal';
import { resolveMediaUrl } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

import { PendingReviewItem } from '@/features/customer/reviews.service';

export function ReviewPromptBanner() {
  const { data: pendingReviews } = usePendingReviews();
  const [selectedProduct, setSelectedProduct] = useState<PendingReviewItem | null>(null);

  if (!pendingReviews || !Array.isArray(pendingReviews) || pendingReviews.length === 0) {
    return null;
  }

  const currentItem = pendingReviews[0];
  const imageUrl = resolveMediaUrl(currentItem.productImage) || PLACEHOLDER_IMAGE;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 via-sky-50 to-pink-50 border border-amber-200/80 rounded-3xl p-4 shadow-xs relative overflow-hidden space-y-3 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--brand-primary)] uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse" />
            <span>Rate Your Recent Purchase</span>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300/60 px-2.5 py-0.5 rounded-full">
            <Gift className="w-3 h-3 text-amber-600" />
            <span>Earn +50 Points</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-white/80 shadow-2xs">
          <Image
            src={imageUrl}
            alt={currentItem.productTitle}
            width={56}
            height={56}
            className="w-14 h-14 object-cover rounded-xl border border-neutral-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-900 truncate">
              {currentItem.productTitle}
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Delivered with Order #{currentItem.orderNumber}
            </p>
            
            {/* Quick 5-star trigger */}
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedProduct(currentItem)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star className="w-4 h-4 text-amber-400 fill-amber-300" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSelectedProduct(currentItem)}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <span>Review</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {selectedProduct && (
        <ReviewFormModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </>
  );
}
