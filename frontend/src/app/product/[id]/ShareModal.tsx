'use client';

import React from 'react';
import { X, Copy, Share2, Send, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-in relative">
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-xl"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
        <h4 className="text-base font-bold font-serif text-[var(--brand-primary)]">Share this style</h4>
        <div className="grid grid-cols-4 gap-4 py-2">
          <a
            href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-xs text-neutral-600 hover:text-[var(--brand-primary)]"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span>WhatsApp</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-xs text-neutral-600 hover:text-[var(--brand-primary)]"
          >
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Share2 className="w-5 h-5" />
            </div>
            <span>Facebook</span>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-xs text-neutral-600 hover:text-[var(--brand-primary)]"
          >
            <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Send className="w-5 h-5" />
            </div>
            <span>Twitter</span>
          </a>
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1.5 text-xs text-neutral-600 hover:text-[var(--brand-primary)]"
          >
            <div className="w-11 h-11 rounded-full bg-neutral-50 text-neutral-600 flex items-center justify-center border border-neutral-100">
              <Copy className="w-5 h-5" />
            </div>
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
