'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrders } from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import type { OrderDto } from '@/features/customer/orders.service';

export default function OrdersPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerOrders({}, isAuthenticated);

  const orders = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { orders?: unknown[]; data?: unknown[] };
    if (Array.isArray(typed?.orders)) return typed.orders as never[];
    if (Array.isArray(typed?.data)) return typed.data as never[];
    return [];
  }, [data]);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <Package className="w-10 h-10 text-neutral-300" />
        <p className="text-sm text-neutral-600">Login to view your orders</p>
        <Link href="/login?redirect=/orders" className="bg-[#0284c7] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="max-w-3xl mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {isLoading && <p className="text-sm text-neutral-500">Loading orders…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {!isLoading && orders.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-12">No orders yet</p>
        )}
        {orders.map((order: OrderDto) => (
          <div key={order.id || order.orderNumber} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">#{order.orderNumber}</p>
                <p className="text-[11px] text-neutral-500">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase bg-sky-50 text-[#0284c7] px-2 py-1 rounded-lg">
                {order.status}
              </span>
            </div>
            <p className="text-sm font-bold text-[#0284c7]">
              {formatInr(Number(order.grandTotal ?? order.total ?? 0))}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <Link href={`/orders/details/${order.orderNumber}`} className="text-[#0284c7] font-bold">
                View Details
              </Link>
              <Link href={`/orders/track/${order.orderNumber}`} className="text-neutral-600">
                Track
              </Link>
              <Link href={`/orders/return/${order.orderNumber}`} className="text-neutral-600">
                Return
              </Link>
              <Link href={`/orders/review/${order.orderNumber}`} className="text-neutral-600">
                Review
              </Link>
            </div>
          </div>
        ))}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
