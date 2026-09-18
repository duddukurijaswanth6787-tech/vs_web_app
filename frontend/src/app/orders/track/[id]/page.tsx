'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Truck, PackageCheck, Clock, ExternalLink, Copy, Check, FileText } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useOrderTracking } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

interface TrackingEntry {
  status?: string;
  time?: string;
  timestamp?: string;
  location?: string;
}

export default function OrderTrackPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useOrderTracking(orderNumber, isAuthenticated);
  const [copied, setCopied] = useState(false);

  const copyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center max-w-sm w-full space-y-4">
          <Truck className="w-10 h-10 text-[var(--brand-primary)] mx-auto" />
          <h2 className="text-base font-bold">Track Your Order</h2>
          <p className="text-xs text-neutral-500">Please sign in to view real-time delivery updates for #{orderNumber}</p>
          <Link href={`/login?redirect=/orders/track/${orderNumber}`} className="block w-full bg-[var(--brand-primary)] text-white text-xs font-bold py-3 rounded-xl">
            Login to Track
          </Link>
        </div>
      </div>
    );
  }

  const timelineList: TrackingEntry[] = (Array.isArray(data?.timeline) ? data.timeline : Array.isArray(data?.history) ? data.history : []) as TrackingEntry[];
  const trackingNumber = data?.trackingNumber ? String(data.trackingNumber) : '';
  const carrier = data?.carrier ? String(data.carrier) : (trackingNumber ? 'Delhivery' : 'Vasanthi Logistics');
  const trackingUrl = data?.trackingUrl ? String(data.trackingUrl) : (trackingNumber ? `https://www.delhivery.com/track/package/${trackingNumber}` : '');

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold font-serif text-[var(--brand-primary)]">Track Shipment</h1>
            <p className="text-[11px] text-neutral-500">Order #{orderNumber}</p>
          </div>
        </div>
        <Link href={`/orders/details/${orderNumber}`} className="text-xs text-[var(--brand-primary)] font-semibold flex items-center gap-1 hover:underline">
          <FileText className="w-3.5 h-3.5" /> Details
        </Link>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 flex-1 space-y-4">
        {isLoading && (
          <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-neutral-200">
            <Clock className="w-8 h-8 text-neutral-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500">Fetching live courier updates…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-600">
            {getApiErrorMessage(error)}
          </div>
        )}

        {data && (
          <>
            {/* Status & Courier Card */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">Shipment Status</span>
                  <p className="text-base font-bold text-[var(--brand-primary)] flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    {String(data.currentStatus || data.status || 'Order Placed')}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-[var(--brand-primary)] border border-sky-100">
                  {carrier}
                </span>
              </div>

              {trackingNumber ? (
                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-neutral-50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-medium block">Waybill (AWB)</span>
                    <span className="font-mono font-bold text-neutral-800">{trackingNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyAwb(trackingNumber)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[var(--brand-primary)] text-white px-2.5 py-1.5 rounded-lg hover:opacity-90"
                      >
                        <ExternalLink className="w-3 h-3" /> Live Tracking
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  Waybill will be assigned once package is picked up by Delhivery.
                </p>
              )}
            </div>

            {/* Timeline Milestones */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Activity Timeline</h2>
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {timelineList.length > 0 ? (
                  timelineList.map((t: TrackingEntry, i: number) => {
                    const isLatest = i === 0 || i === timelineList.length - 1;
                    return (
                      <div key={i} className="relative group">
                        <div className={`absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isLatest ? 'bg-[var(--brand-primary)] ring-2 ring-sky-100' : 'bg-neutral-400'
                        }`} />
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold ${isLatest ? 'text-neutral-900' : 'text-neutral-700'}`}>
                            {String(t.status || 'Status Update')}
                          </p>
                          {t.location && (
                            <p className="text-[11px] text-neutral-500">{t.location}</p>
                          )}
                          <p className="text-[10px] text-neutral-400">
                            {t.time || t.timestamp ? new Date(String(t.time || t.timestamp)).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-[var(--brand-primary)] border-2 border-white" />
                    <p className="text-xs font-bold text-neutral-800">Order Placed & Confirmed</p>
                    <p className="text-[10px] text-neutral-400">Your order is being processed for dispatch.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href={`/orders/details/${orderNumber}`}
                className="flex-1 text-center py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                View Order Details
              </Link>
              <Link
                href="/orders"
                className="flex-1 text-center py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:opacity-90"
              >
                All Orders
              </Link>
            </div>
          </>
        )}
      </main>
      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
