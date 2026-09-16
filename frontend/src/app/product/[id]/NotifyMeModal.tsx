'use client';

import React, { useState } from 'react';
import { Bell, X, CheckCircle2, Phone, Mail, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  selectedSize?: string;
  selectedColor?: string;
  variantId?: string;
}

export function NotifyMeModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  selectedSize,
  selectedColor,
  variantId,
}: NotifyMeModalProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanPhone && !cleanEmail) {
      setErrorMsg('Please enter either your Mobile / WhatsApp number or Email address.');
      return;
    }

    if (cleanPhone && cleanPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/inventory/notify-restock', {
        productId,
        variantId: variantId || undefined,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        phone: cleanPhone || undefined,
        email: cleanEmail || undefined,
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        error?.response?.data?.message || error?.message || 'Failed to submit request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setErrorMsg('');
    setPhone('');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden animate-scale-up">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 p-6 text-white relative">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Bell className="w-6 h-6 text-white animate-bounce-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-100">
                <Sparkles className="w-3.5 h-3.5" />
                Restock Alert
              </div>
              <h3 className="text-lg font-black text-white">Notify Me When Available</h3>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-neutral-900">You&apos;re on the VIP Alert List!</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  We will immediately send an alert to your contact details the moment this item is restocked.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-2"
              >
                Got It, Thank You!
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product preview snippet */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                {productImage ? (
                  <div className="w-12 h-16 rounded-xl overflow-hidden relative shrink-0 bg-neutral-200 border border-neutral-300">
                    <Image
                      src={productImage}
                      alt={productName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-16 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-neutral-900 truncate">{productName}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {selectedSize && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-800">
                        Size: {selectedSize}
                      </span>
                    )}
                    {selectedColor && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700">
                        Color: {selectedColor}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-red-600 uppercase">
                      Currently Sold Out
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Provide your WhatsApp number or email. We will notify you instantly when fresh stock arrives at our boutique or online store.
              </p>

              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* Phone number input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-neutral-700 uppercase tracking-wider">
                  Mobile / WhatsApp Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-neutral-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-16 pr-3.5 py-3 text-xs font-bold bg-neutral-50/70 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-neutral-800"
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-neutral-700 uppercase tracking-wider">
                  Email Address (Optional)
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 text-xs font-medium bg-neutral-50/70 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-neutral-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Request...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 fill-white" />
                      Notify Me When Available
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                No spam. You will only be alerted once when stock arrives.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
