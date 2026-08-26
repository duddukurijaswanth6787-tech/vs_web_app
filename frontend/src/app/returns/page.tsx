'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useMyReturns, useCancelReturn, useFeatureEnabled } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-sky-50 text-sky-700',
  PICKED_UP: 'bg-blue-50 text-blue-700',
  REFUNDED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export default function ReturnsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const returnsEnabled = useFeatureEnabled('returns');
  const { data, isLoading, error } = useMyReturns({}, isAuthenticated);
  const cancelReturn = useCancelReturn();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const returns = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { data?: unknown[] };
    if (Array.isArray(typed?.data)) return typed.data as never[];
    return [];
  }, [data]);

  const onCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelReturn.mutateAsync(id);
    } catch {
      // error surfaced via mutation state below is enough for now
    } finally {
      setCancellingId(null);
    }
  };

  // Guards the direct URL, not just the nav links -- hiding the entry points
  // alone still leaves /returns reachable by typed URL or stale bookmark.
  if (!returnsEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <RotateCcw className="w-10 h-10 text-neutral-300" />
        <p className="text-sm text-neutral-600">Returns are not available at the moment.</p>
        <Link href="/" className="text-xs font-bold text-[var(--brand-primary)]">Back to Home</Link>
      </div>
    );
  }

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <RotateCcw className="w-10 h-10 text-neutral-300" />
        <p className="text-sm text-neutral-600">Login to view your returns</p>
        <Link href="/login?redirect=/returns" className="bg-[var(--brand-primary)] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">My Returns</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {isLoading && <p className="text-sm text-neutral-500">Loading returns…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {!isLoading && returns.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <RotateCcw className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="text-sm text-neutral-600">No return requests yet</p>
            <Link href="/orders" className="inline-block bg-[var(--brand-primary)] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
              View Orders
            </Link>
          </div>
        )}

        {returns.map((retItem) => {
          const ret = retItem as Record<string, unknown>;
          const retId = String(ret.id || '');
          const retNum = String(ret.returnNumber || retId || '');
          const orderNum = String(ret.orderNumber || '');
          const statusStr = String(ret.status || '');
          const createdAtStr = ret.createdAt ? new Date(String(ret.createdAt)).toLocaleDateString() : '';
          return (
            <div key={retId} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Return #{retNum}</p>
                <p className="text-[11px] text-neutral-500">
                  Order #{orderNum} · {createdAtStr}
                </p>
              </div>
              <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-lg ${STATUS_STYLES[statusStr] || 'bg-neutral-100 text-neutral-600'}`}>
                {statusStr}
              </span>
            </div>
            <p className="text-xs text-neutral-600">{String(ret.reason || '')}</p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold pt-1">
              {['REQUESTED', 'APPROVED'].includes(statusStr) && (
                <button
                  type="button"
                  disabled={cancellingId === retId}
                  onClick={() => onCancel(retId)}
                  className="text-sky-700 disabled:opacity-50"
                >
                  {cancellingId === retId ? 'Cancelling…' : 'Cancel Return'}
                </button>
              )}
              <Link href={`/orders/details/${orderNum}`} className="text-neutral-600">
                View Order
              </Link>
            </div>
          </div>
        );
      })}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
