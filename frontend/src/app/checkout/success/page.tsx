'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useCustomerOrder } from '@/features/customer/hooks';
import { useAuth } from '@/hooks/useAuth';
import { formatInr } from '@/features/customer/mappers';

function CheckoutSuccessPageContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '';
  const { isAuthenticated } = useAuth();
  const { data: order } = useCustomerOrder(orderNumber, !!orderNumber && isAuthenticated);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <main className="max-w-md mx-auto w-full px-4 py-16 flex-1 text-center space-y-4">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
        <h1 className="text-2xl font-bold font-serif text-[#0284c7]">Order Placed</h1>
        {orderNumber && (
          <p className="text-sm text-neutral-600">
            Order number: <span className="font-bold">#{orderNumber}</span>
          </p>
        )}
        {order?.grandTotal != null && (
          <p className="text-sm font-bold text-[#0284c7]">
            Total paid: {formatInr(Number(order.grandTotal))}
          </p>
        )}
        <p className="text-xs text-neutral-500">Thank you for shopping with Vasanthi&apos;s Signature.</p>
        <div className="flex flex-col gap-2 pt-4">
          {orderNumber && (
            <Link
              href={`/orders/track/${orderNumber}`}
              className="bg-[#0284c7] text-white text-sm font-bold py-3 rounded-xl"
            >
              Track Order
            </Link>
          )}
          <Link href="/orders" className="border border-neutral-200 text-sm font-bold py-3 rounded-xl">
            View Orders
          </Link>
          <Link href="/" className="text-xs font-semibold text-[#0284c7]">
            Continue Shopping
          </Link>
        </div>
      </main>
      <StorefrontFooter />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans">Loading...</div>}>
      <CheckoutSuccessPageContent />
    </React.Suspense>
  );
}
