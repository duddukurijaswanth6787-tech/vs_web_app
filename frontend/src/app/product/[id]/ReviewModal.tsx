'use client';

import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; comment: string }) => void;
}

export function ReviewModal({ isOpen, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment });
    setComment('');
    alert('Thank you! Your review has been submitted for moderation.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in relative">
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-xl"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
        <h4 className="text-base font-bold font-serif text-[#800020]">Write a Review</h4>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-500">Rating</label>
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="hover:scale-110 transition-transform"
              >
                <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-500">Your Review</label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this garment's fabric, fit, and style..."
            className="w-full text-xs border border-neutral-200 rounded-xl p-3 outline-none focus:border-[#800020] transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#800020] text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-[#600018] transition-colors shadow-md"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}
