'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { usePaymentMethods } from '@/features/customer/hooks';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePaymentsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading } = usePaymentMethods();

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/payments" className="text-sm font-bold text-[#800020]">
          Login required
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Payment Methods</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {(data || []).map((m: any) => (
          <div key={m.code} className="bg-white border border-neutral-200 rounded-2xl p-4 flex gap-3">
            <CreditCard className="w-5 h-5 text-[#800020] shrink-0" />
            <div>
              <p className="text-sm font-bold">{m.title}</p>
              <p className="text-xs text-neutral-500 mt-1">{m.description}</p>
            </div>
          </div>
        ))}
        <p className="text-[11px] text-neutral-400">
          Saved cards/UPI are managed securely at checkout via payment gateway.
        </p>
      </main>
      <StorefrontFooter />
    </div>
  );
}
