'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  MessageCircle, 
  Mail, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { resolveMediaUrl, isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { formatInr, PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  image?: string;
  price?: number | string;
  description?: string;
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  url, 
  title,
  image,
  price,
  description 
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `Check out this gorgeous outfit on Vasanthi's Signature: ${title}${price ? ` (₹${Number(price).toLocaleString('en-IN')})` : ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: resolvedUrl,
        });
      } catch (err) {
        // Ignore user cancel
      }
    } else {
      handleCopy();
    }
  };

  const encodedUrl = encodeURIComponent(resolvedUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);
  const encodedImage = encodeURIComponent(image || '');

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in relative border border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 text-sky-600 text-xs font-black uppercase tracking-widest">
            <Share2 className="w-4 h-4" />
            <span>Share Product</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-neutral-900 mt-1">
            Share this Style
          </h3>
        </div>

        {/* Product Snapshot Card */}
        <div className="flex items-center gap-3.5 p-3 bg-sky-50/50 rounded-2xl border border-sky-100/80">
          <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-sky-100">
            <Image
              src={withVariant(resolveMediaUrl(image || PLACEHOLDER_IMAGE), 'thumb')}
              alt={title}
              fill
              sizes="56px"
              unoptimized={isLocalOrPlaceholder(resolveMediaUrl(image || PLACEHOLDER_IMAGE))}
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-extrabold text-sky-700 uppercase tracking-wider block">
              VASANTHI&apos;S SIGNATURE
            </span>
            <h4 className="text-xs font-bold text-neutral-900 truncate mt-0.5">
              {title}
            </h4>
            {price && (
              <p className="text-xs font-black text-sky-600 mt-1">
                {typeof price === 'number' ? formatInr(price) : `₹${price}`}
              </p>
            )}
          </div>
        </div>

        {/* Native Mobile Share Button (If supported) */}
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-98 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            SHARE VIA PHONE APPS (WHATSAPP, INSTAGRAM, ETC.)
          </button>
        )}

        {/* Social Share Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-1">
          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-neutral-600 hover:text-emerald-600 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-108 group-hover:bg-emerald-100/70 transition-all shadow-2xs">
              <MessageCircle className="w-5 h-5 fill-emerald-600 text-emerald-600" />
            </div>
            <span>WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-neutral-600 hover:text-sky-500 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100 group-hover:scale-108 group-hover:bg-sky-100/70 transition-all shadow-2xs">
              <Send className="w-5 h-5 fill-sky-500 text-sky-500" />
            </div>
            <span>Telegram</span>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-neutral-600 hover:text-blue-600 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-108 group-hover:bg-blue-100/70 transition-all shadow-2xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span>Facebook</span>
          </a>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center border border-neutral-200 group-hover:scale-108 group-hover:bg-neutral-200 transition-all shadow-2xs">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span>X (Twitter)</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`}
            className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-neutral-600 hover:text-amber-600 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-108 group-hover:bg-amber-100/70 transition-all shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <span>Email</span>
          </a>
        </div>

        {/* Copy Link Input Section */}
        <div className="space-y-1.5 pt-2">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Page Link
          </label>
          <div className="flex items-center gap-2 p-1.5 pl-3 bg-neutral-50 rounded-2xl border border-neutral-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
            <input
              type="text"
              readOnly
              value={resolvedUrl}
              className="flex-1 bg-transparent text-xs text-neutral-700 font-mono focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
