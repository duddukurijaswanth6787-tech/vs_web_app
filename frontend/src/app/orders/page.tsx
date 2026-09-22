'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Truck,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  Search,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrders, useFeatureEnabled } from '@/features/customer/hooks';
import { formatInr, PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import type { OrderDto } from '@/features/customer/orders.service';

type FilterTab = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

export default function OrdersPage() {
  const returnsEnabled = useFeatureEnabled('returns');
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerOrders({}, isAuthenticated);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const orders = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { orders?: unknown[]; data?: unknown[]; items?: unknown[] };
    if (Array.isArray(typed?.orders)) return typed.orders as OrderDto[];
    if (Array.isArray(typed?.data)) return typed.data as OrderDto[];
    if (Array.isArray(typed?.items)) return typed.items as OrderDto[];
    return [];
  }, [data]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusUpper = String(order.status || '').toUpperCase();
      const orderNum = String(order.orderNumber || '').toLowerCase();
      const matchesSearch =
        !searchQuery ||
        orderNum.includes(searchQuery.toLowerCase()) ||
        order.items?.some((it) => (it.productName || '').toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'ACTIVE') {
        return ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(
          statusUpper
        );
      }
      if (activeTab === 'DELIVERED') {
        return statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED';
      }
      if (activeTab === 'CANCELLED') {
        return statusUpper.includes('CANCEL') || statusUpper.includes('REFUND');
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
        <StorefrontHeader />
        <main className="max-w-md mx-auto w-full px-4 py-16 flex-1 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto shadow-sm">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[var(--brand-primary)]">My Orders</h2>
            <p className="text-xs text-neutral-500">Please sign in to view and track your orders</p>
          </div>
          <Link
            href="/login?redirect=/orders"
            className="block w-full bg-[var(--brand-primary)] text-white text-xs font-bold py-3.5 rounded-2xl shadow-xs hover:opacity-95 transition-all"
          >
            Login to View Orders
          </Link>
        </main>
        <StorefrontFooter />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <StorefrontHeader />

      {/* Sticky Header Nav */}
      <div className="bg-white/95 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="p-1.5 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <h1 className="text-base sm:text-lg font-bold font-serif text-[var(--brand-primary)]">
              My Orders ({orders.length})
            </h1>
          </div>

          <Link
            href="/track-order"
            className="px-3 py-1.5 text-xs font-bold text-[var(--brand-primary)] bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Track AWB</span>
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7 flex-1 space-y-4">
        {/* Search & Tabs Filter */}
        <div className="space-y-3">
          {/* Status Tabs (Amazon / Flipkart Style) */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-neutral-200/90 shadow-2xs overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: `All (${orders.length})` },
              { id: 'ACTIVE', label: 'In Transit / Active' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          {orders.length > 3 && (
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by order # or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-neutral-200 shadow-2xs">
            <Clock className="w-8 h-8 text-[var(--brand-primary)] animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">Loading your orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700">
            {getApiErrorMessage(error, 'Failed to load orders')}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center space-y-4 border border-neutral-200 shadow-xs max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                {activeTab === 'ALL' ? 'No orders found' : `No ${activeTab.toLowerCase()} orders`}
              </h3>
              <p className="text-xs text-neutral-500">
                {activeTab === 'ALL'
                  ? 'Explore our latest collections and place your first order.'
                  : 'You do not have any orders under this category.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-block bg-[var(--brand-primary)] text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-xs hover:opacity-95 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Orders List Cards (Luxury Amazon/Flipkart mobile design) */}
        <div className="space-y-4">
          {filteredOrders.map((order: OrderDto) => {
            const statusUpper = String(order.status || '').toUpperCase();
            const isDelivered = statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED';
            const isCancelled = statusUpper.includes('CANCEL');
            const isShipped = statusUpper.includes('SHIP') || statusUpper.includes('TRANSIT');
            const totalAmount = Number(order.grandTotal ?? order.totalAmount ?? order.total ?? 0);
            const items = order.items || [];
            const waybill = (order.waybillNumber as string) || '';

            return (
              <div
                key={order.id || order.orderNumber}
                className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Card Header: Order #, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 font-mono">
                        #{order.orderNumber}
                      </span>
                      {waybill && (
                        <span className="text-[10px] bg-sky-50 text-[var(--brand-primary)] font-semibold px-2 py-0.5 rounded-full border border-sky-100 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Delhivery
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isDelivered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
                      </span>
                    ) : isCancelled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
                      </span>
                    ) : isShipped ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-sky-50 text-[var(--brand-primary)] border border-sky-200 px-2.5 py-1 rounded-full animate-pulse">
                        <Truck className="w-3.5 h-3.5" /> In Transit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> {order.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                          <Image
                            src={item.imageUrl || (item as any).product?.media?.[0]?.url || PLACEHOLDER_IMAGE}
                            alt={item.productName || 'Product'}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-[11px] text-neutral-500 truncate">
                              Variant: {item.variantName}
                            </p>
                          )}
                          <p className="text-[11px] text-neutral-500">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-neutral-900">
                          {formatInr(Number(item.totalPrice || item.unitPrice * item.quantity))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary Strip & Total */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <span className="text-neutral-500 font-medium">
                    Total ({items.reduce((s, i) => s + (i.quantity || 1), 0)} items)
                  </span>
                  <span className="text-sm font-extrabold text-[var(--brand-primary)]">
                    {formatInr(totalAmount)}
                  </span>
                </div>

                {/* Bottom Action Buttons (Amazon Grade) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    {/* Track Package Button */}
                    <Link
                      href={`/orders/track/${order.orderNumber}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-[var(--brand-primary)] border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Shipment</span>
                    </Link>

                    {/* View Details */}
                    <Link
                      href={`/orders/details/${order.orderNumber}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Details &amp; Invoice</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {returnsEnabled && isDelivered && (
                      <Link
                        href={`/orders/return/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-neutral-600 hover:text-neutral-900 text-xs font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return
                      </Link>
                    )}
                    {isDelivered && (
                      <Link
                        href={`/orders/review/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Write Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
