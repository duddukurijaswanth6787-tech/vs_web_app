'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerReferral } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ReferralPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerReferral(isAuthenticated);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/referral" className="text-sm font-bold text-[var(--brand-primary)]">
          Login required
        </Link>
      </div>
    );
  }

  const typed = data as { code?: { code?: string; referralCode?: string } | string; rewards?: unknown } | undefined;
  const code = typed?.code && typeof typed.code === 'object' ? typed.code.code || typed.code.referralCode || '' : typed?.code || '';

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Referral</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-4">
        {isLoading && <p className="text-sm text-neutral-500">Loading referral…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center space-y-3">
          <p className="text-xs text-neutral-500">Your referral code</p>
          <p className="text-2xl font-black tracking-widest text-[var(--brand-primary)]">{String(code) || '—'}</p>
          {code && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(String(code))}
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)]"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          )}
        </div>
        <div className="bg-white border border-neutral-200 rounded-3xl p-4">
          <h2 className="text-sm font-bold mb-2">Rewards</h2>
          <pre className="text-[11px] text-neutral-600 whitespace-pre-wrap overflow-auto">
            {JSON.stringify(typed?.rewards || {}, null, 2)}
          </pre>
        </div>
      </main>
      <StorefrontFooter />
    </div>
  );
}
