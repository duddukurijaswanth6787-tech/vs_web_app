'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Truck, MapPin, CreditCard, Download, PackageCheck, FileText } from 'lucide-react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useCustomerOrder, useOrderInvoice } from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import type { OrderItemDto } from '@/features/customer/orders.service';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const { data: order, isLoading, error } = useCustomerOrder(orderNumber, true);
  const { data: invoiceData } = useOrderInvoice(orderNumber, !!order);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-neutral-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-sm font-bold text-red-600">{getApiErrorMessage(error, 'Order not found')}</p>
        <Link href="/orders" className="text-xs text-[var(--brand-primary)] font-bold">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const shippingAddr = (order.shippingAddress || (Array.isArray(order.addresses) ? order.addresses[0] : undefined)) as any;

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold font-serif text-[var(--brand-primary)]">Order #{order.orderNumber}</h1>
            <p className="text-[11px] text-neutral-500">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-sky-50 text-[var(--brand-primary)] border border-sky-100">
          {order.status}
        </span>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-5 flex-1 space-y-4 text-xs">
        {/* Quick Action Bar */}
        <div className="flex gap-2">
          <Link
            href={`/orders/track/${order.orderNumber}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold shadow-xs hover:opacity-95"
          >
            <Truck className="w-4 h-4" /> Track Order
          </Link>
          {(invoiceData?.pdfUrl || invoiceData?.invoiceUrl) && (
            <a
              href={invoiceData.pdfUrl || invoiceData.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="w-4 h-4" /> Invoice
            </a>
          )}
        </div>

        {/* Order Items Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b pb-2">Items Ordered</h2>
          <div className="divide-y divide-neutral-100">
            {order.items?.map((item: OrderItemDto) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-[11px] text-neutral-500">Variant: {item.variantName}</p>
                  )}
                  <p className="text-[11px] text-neutral-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-neutral-900">{formatInr(Number(item.totalPrice))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address Card */}
        {shippingAddr && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b pb-2">
              <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Delivery Address
            </div>
            <div className="pt-1 text-neutral-700 space-y-0.5">
              <p className="font-bold text-neutral-900">{shippingAddr.fullName || shippingAddr.name}</p>
              <p>
                {[shippingAddr.addressLine1, shippingAddr.addressLine2, shippingAddr.city, shippingAddr.state, shippingAddr.postalCode || shippingAddr.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {shippingAddr.phone && <p className="text-neutral-500 mt-1">Phone: {shippingAddr.phone}</p>}
            </div>
          </div>
        )}

        {/* Price & Payment Summary */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b pb-2">
            <CreditCard className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Payment Summary
          </div>
          <div className="space-y-1.5 pt-1 text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatInr(Number(order.subtotal || order.totalAmount || 0))}</span>
            </div>
            {Number(order.discountTotal || order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>-{formatInr(Number(order.discountTotal || order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{Number(order.shippingCharge || order.shippingFee || 0) > 0 ? formatInr(Number(order.shippingCharge || order.shippingFee)) : 'Free'}</span>
            </div>
            <div className="border-t border-neutral-100 pt-2 flex justify-between font-bold text-sm text-neutral-900">
              <span>Grand Total</span>
              <span className="text-[var(--brand-primary)]">{formatInr(Number(order.grandTotal ?? order.total ?? order.totalAmount ?? 0))}</span>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
