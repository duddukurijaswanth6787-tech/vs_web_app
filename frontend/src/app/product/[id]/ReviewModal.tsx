'use client';

import React, { useState } from 'react';
import { X, Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCreateReview } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

interface ReviewModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewModal({ productId, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const createReviewMutation = useCreateReview();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await createReviewMutation.mutateAsync({
        productId,
        rating,
        title: title || 'Customer Review',
        comment,
        images: imageUrl ? [imageUrl] : undefined,
      });

      setSuccessMsg('Thank you! Your review has been submitted successfully.');
      setTitle('');
      setComment('');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Failed to submit review. Please try again.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in relative">
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h4 className="text-base font-bold font-serif text-[#800020]">Write a Customer Review</h4>
        
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 block">Rating *</label>
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="hover:scale-110 transition-transform cursor-pointer"
              >
                <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'text-neutral-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 block">Review Headline / Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Gorgeous Kanjeevaram Saree & Excellent Fit!"
            className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-[#800020] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 block">Your Review Comments *</label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this garment's fabric quality, fit, color vibrancy, and style..."
            className="w-full text-xs border border-neutral-200 rounded-xl p-3 outline-none focus:border-[#800020] transition-colors resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 block">Review Photo URL (Optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/saree-review-photo.jpg"
            className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-[#800020] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={createReviewMutation.isPending}
          className="w-full bg-[#800020] text-white text-xs font-bold py-3 px-4 rounded-xl hover:bg-[#600018] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {createReviewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{createReviewMutation.isPending ? 'Submitting Review...' : 'Submit Review'}</span>
        </button>
      </form>
    </div>
  );
}
