'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AddressRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const addressId = searchParams.get('addressId');
    if (addressId) {
      router.replace(`/checkout?addressId=${addressId}`);
    } else {
      router.replace('/checkout');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-neutral-900 font-serif">Checkout</h3>
          <p className="text-xs text-neutral-500">Loading your checkout experience...</p>
        </div>
      </div>
    </div>
  );
}

export default function AddressListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <AddressRedirectContent />
    </Suspense>
  );
}

