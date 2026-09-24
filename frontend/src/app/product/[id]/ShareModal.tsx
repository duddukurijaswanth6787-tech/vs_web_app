'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Sparkles,
  MoreHorizontal
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
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  if (!isOpen) return null;

  const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `Check out this stunning piece from Vasanthi's Signature: ${title}${price ? ` (₹${Number(price).toLocaleString('en-IN')})` : ''}`;

  const handleCopy = () => {
    if (!resolvedUrl) return;
    navigator.clipboard.writeText(resolvedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = resolvedUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch (e) {
        console.error('Failed to copy', e);
      }
    });
  };

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: resolvedUrl,
        });
      } catch (err) {
        // Ignore user cancellation
      }
    } else {
      handleCopy();
    }
  };

  const encodedUrl = encodeURIComponent(resolvedUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedImage = encodeURIComponent(image || '');

  return (
    <div 
      className="fixed inset-0 z-50 bg-neutral-950/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in relative border border-neutral-100/80"
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
          <div className="flex items-center gap-1.5 text-sky-600 text-[11px] font-black uppercase tracking-widest">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Product</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-neutral-900 mt-0.5">
            Share this Style
          </h3>
        </div>

        {/* Product Snapshot Card */}
        <div className="flex items-center gap-3.5 p-3 bg-sky-50/40 rounded-2xl border border-sky-100/60">
          <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-sky-100">
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
            <h4 className="text-xs font-bold text-neutral-900 truncate mt-0.5" title={title}>
              {title}
            </h4>
            {price && (
              <p className="text-xs font-black text-sky-600 mt-1">
                {typeof price === 'number' ? formatInr(price) : `₹${price}`}
              </p>
            )}
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-5 gap-2.5 pt-1">
          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-neutral-700 hover:text-emerald-600 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20 group-hover:scale-105 group-hover:bg-[#25D366] group-hover:text-white transition-all shadow-xs">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.462 3.486 1.34 5.006L2 22l5.12-1.344c1.474.805 3.136 1.232 4.884 1.232 5.518 0 9.996-4.478 9.996-9.996 0-5.518-4.478-9.996-9.996-9.996zm0 18.292c-1.516 0-2.996-.408-4.296-1.18l-.308-.184-3.192.836.852-3.112-.2-.32a8.27 8.27 0 0 1-1.272-4.436c0-4.576 3.72-8.296 8.296-8.296 4.576 0 8.296 3.72 8.296 8.296 0 4.576-3.72 8.296-8.296 8.296zm4.544-6.204c-.248-.124-1.472-.728-1.7-.81-.228-.084-.396-.124-.564.124-.168.248-.648.81-.792.978-.148.168-.292.188-.54.064-.248-.124-1.048-.388-1.996-1.232-.736-.656-1.232-1.468-1.376-1.716-.144-.248-.016-.384.108-.508.112-.112.248-.292.372-.436.124-.148.168-.248.248-.416.084-.168.044-.316-.02-.44-.064-.124-.564-1.36-.772-1.864-.204-.492-.412-.424-.564-.432l-.48-.008c-.168 0-.44.064-.668.316-.228.248-.872.852-.872 2.076 0 1.224.892 2.408 1.016 2.576.124.168 1.752 2.676 4.244 3.752.592.256 1.056.408 1.416.524.596.188 1.14.16 1.568.096.48-.072 1.472-.604 1.68-1.188.208-.584.208-1.084.148-1.188-.06-.104-.224-.168-.472-.292z"/>
              </svg>
            </div>
            <span>WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-neutral-700 hover:text-sky-500 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center border border-[#229ED9]/20 group-hover:scale-105 group-hover:bg-[#229ED9] group-hover:text-white transition-all shadow-xs">
              <svg className="w-5 h-5 fill-current ml-[-1px]" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
              </svg>
            </div>
            <span>Telegram</span>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-neutral-700 hover:text-[#1877F2] transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center border border-[#1877F2]/20 group-hover:scale-105 group-hover:bg-[#1877F2] group-hover:text-white transition-all shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span>Facebook</span>
          </a>

          {/* X (Twitter) */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-neutral-700 hover:text-black transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-900/10 text-neutral-900 flex items-center justify-center border border-neutral-200 group-hover:scale-105 group-hover:bg-neutral-900 group-hover:text-white transition-all shadow-xs">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span>X (Twitter)</span>
          </a>

          {/* Pinterest or More */}
          {canNativeShare ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-neutral-700 hover:text-sky-600 transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span>More</span>
            </button>
          ) : (
            <a
              href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-neutral-700 hover:text-[#E60023] transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E60023]/10 text-[#E60023] flex items-center justify-center border border-[#E60023]/20 group-hover:scale-105 group-hover:bg-[#E60023] group-hover:text-white transition-all shadow-xs">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                </svg>
              </div>
              <span>Pinterest</span>
            </a>
          )}
        </div>

        {/* Copy Link Section */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Page Link
          </label>
          <div 
            onClick={handleCopy}
            className="flex items-center gap-2 p-1.5 pl-3.5 bg-neutral-50 hover:bg-neutral-100/70 cursor-pointer rounded-2xl border border-neutral-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all group"
          >
            <span className="flex-1 text-xs text-neutral-700 font-mono select-all truncate">
              {resolvedUrl}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
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
