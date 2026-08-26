'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
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

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href={`/login?redirect=/orders/track/${orderNumber}`} className="text-sm font-bold text-[var(--brand-primary)]">
          Login to track order
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/orders" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Track #{orderNumber}</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-4">
        {isLoading && <p className="text-sm text-neutral-500">Loading tracking…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {data && (
          <>
            <div className="bg-white border border-neutral-200 rounded-2xl p-4">
              <p className="text-xs text-neutral-500">Current status</p>
              <p className="text-sm font-bold text-[var(--brand-primary)] mt-1">{String(data.currentStatus || data.status || '')}</p>
              {data.trackingNumber && (
                <p className="text-xs text-neutral-600 mt-2">AWB: {String(data.trackingNumber)}</p>
              )}
            </div>
            <div className="space-y-2">
              {(Array.isArray(data.timeline) ? data.timeline : Array.isArray(data.history) ? data.history : []).map((t: TrackingEntry, i: number) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold">{String(t.status || '')}</p>
                  <p className="text-[11px] text-neutral-500">{String(t.time || t.timestamp || '')}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <StorefrontFooter />
    </div>
  );
}
