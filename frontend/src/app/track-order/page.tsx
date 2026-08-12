'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { customerOrdersService } from '@/features/customer/orders.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await customerOrdersService.tracking(orderQuery.trim());
      setResult(data as unknown as Record<string, unknown>);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Order or tracking information not found. Please verify your Order Number.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Track Your Order</h1>
      </header>

      <main className="max-w-xl mx-auto w-full px-4 py-8 flex-1 space-y-6">
        {/* Search Card */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-serif font-bold text-[#800020]">Enter Shipment Details</h2>
            <p className="text-xs text-neutral-600">Enter your Order Number (e.g. ORD-1001) or Courier Tracking AWB.</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Order ID / Tracking Number"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-[#800020]"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#800020] text-white text-xs font-bold py-3 rounded-xl hover:bg-[#600018] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Searching...' : 'Track Package'}
            </button>
          </form>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Result View */}
        {result && (
          <div className="bg-white border border-rose-100 rounded-3xl p-6 space-y-4 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Status Update</span>
                <h3 className="font-bold text-sm text-[#800020]">{String(result.status || 'Dispatched')}</h3>
              </div>
              {Boolean(result.awb) && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Courier AWB</span>
                  <p className="text-xs font-mono font-bold text-neutral-800">{String(result.awb)}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-neutral-800">Order Confirmed</p>
                  <p className="text-[11px] text-neutral-500">Your garment has been prepared and passed quality check.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-neutral-800">In Transit</p>
                  <p className="text-[11px] text-neutral-500">Handed over to express courier partner.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-neutral-500 space-y-1">
          <p>Need assistance with your delivery?</p>
          <Link href="/contact" className="text-[#800020] font-bold hover:underline">
            Contact Customer Support
          </Link>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
