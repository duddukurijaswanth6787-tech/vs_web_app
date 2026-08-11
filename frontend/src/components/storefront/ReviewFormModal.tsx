'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { useCreateReview } from '@/features/customer/hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    productId: string;
    productTitle: string;
    productImage?: string;
    orderNumber?: string;
  };
}

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export function ReviewFormModal({ isOpen, onClose, product }: ReviewFormModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const createReviewMutation = useCreateReview();

  if (!isOpen) return null;

  const displayRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createReviewMutation.mutateAsync({
        productId: product.productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit review');
    }
  };

  const imageUrl = resolveMediaUrl(product.productImage) || PLACEHOLDER_IMAGE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-neutral-900">Thank You!</h3>
            <p className="text-xs text-neutral-600">Your review has been submitted successfully.</p>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full mt-2">
              <Gift className="w-4 h-4 text-amber-600" />
              <span>+50 Loyalty Points Earned!</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
              <img
                src={imageUrl}
                alt={product.productTitle}
                className="w-14 h-14 object-cover rounded-xl border border-neutral-200 shrink-0"
              />
              <div className="overflow-hidden">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Purchase</span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                  {product.productTitle}
                </h3>
                {product.orderNumber && (
                  <p className="text-[10px] text-neutral-500">Order #{product.orderNumber}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Interactive Rating Stars */}
            <div className="text-center space-y-1.5 py-1">
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
                Overall Rating
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= displayRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300 fill-neutral-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-amber-700 h-4">
                {RATING_LABELS[displayRating - 1]}
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Review Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your thoughts (e.g. Beautiful fabric & perfect fit!)"
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#800020] focus:bg-white"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Detailed Feedback</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the design, fabric quality, and sizing..."
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#800020] focus:bg-white resize-none"
              />
            </div>

            {/* Loyalty Point Bonus Banner */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/70 rounded-2xl p-3 text-xs text-amber-900">
              <Gift className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Submit your review to claim <strong>+50 Loyalty Reward Points</strong>!</span>
            </div>

            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="w-full bg-[#800020] hover:bg-[#600018] text-white font-bold py-3.5 rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {createReviewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Review</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
