'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Truck,
  FileText,
  MapPin,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Phone,
  Clock,
  Sparkles,
  ChevronRight,
  Receipt,
  Headphones,
} from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCustomerOrder } from '@/features/customer/hooks';
import { formatInr, PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';

export default function OrderConfirmedPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const { data: order, isLoading, error } = useCustomerOrder(orderNumber, true);

  // Auto-scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading && !order) {
    return (
      <div className="min-h-screen bg-[#faf9f8] flex flex-col font-sans antialiased text-neutral-900 pb-20">
        <StorefrontHeader />
        <main className="max-w-md mx-auto w-full px-4 py-20 flex-1 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto shadow-sm animate-pulse">
            <Clock className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-base font-bold text-neutral-800 font-serif">Confirming Order Details...</h2>
          <p className="text-xs text-neutral-500">Retrieving order #{orderNumber}</p>
        </main>
        <StorefrontFooter />
        <MobileBottomNav />
      </div>
    );
  }

  const shippingAddr = (order?.shippingAddress ||
    (Array.isArray(order?.addresses) ? order.addresses[0] : undefined)) as any;
  const totalAmount = Number(order?.grandTotal ?? order?.totalAmount ?? order?.total ?? 0);
  const items = order?.items || [];
  const paymentMethod = String(order?.paymentMethod || 'ONLINE').toUpperCase();

  return (
    <div className="min-h-screen bg-[#faf9f8] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <StorefrontHeader />

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1 space-y-6">
        {/* CELEBRATORY SUCCESS HERO CARD (AMAZON / MYNTRA GRADE) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm text-center relative overflow-hidden space-y-4">
          {/* Confetti Background Accent */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-50/80 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-sky-50/80 blur-2xl pointer-events-none" />

          {/* Animated Success Badge */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-md animate-in zoom-in-90 duration-300">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Order Placed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--brand-primary)] pt-1">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              We have received your order{' '}
              <strong className="font-mono text-neutral-900 font-bold">#{orderNumber}</strong>. An automated SMS &amp; invoice confirmation has been dispatched.
            </p>
          </div>

          {/* ACTION BUTTONS (MOBILE FIRST, PROMINENT) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 max-w-md mx-auto">
            <Link
              href={`/orders/track/${orderNumber}`}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Track Live Delivery</span>
            </Link>

            <Link
              href={`/orders/details/${orderNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-bold py-3.5 px-5 rounded-2xl shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-neutral-500" />
              <span>View Invoice</span>
            </Link>
          </div>
        </div>

        {/* ESTIMATED DELIVERY & SHIPPING TIMELINE BANNER */}
        <div className="bg-gradient-to-r from-sky-50 via-sky-50/50 to-indigo-50/40 border border-sky-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-[var(--brand-primary)] flex items-center justify-center shadow-2xs border border-sky-100 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <p className="text-base sm:text-lg font-bold text-neutral-900">
                Arriving in 2–4 Business Days
              </p>
              <p className="text-[11px] text-neutral-500">
                Dispatched via Delhivery Express Air with real-time GPS tracking
              </p>
            </div>
          </div>

          <Link
            href={`/orders/track/${orderNumber}`}
            className="text-xs font-bold text-[var(--brand-primary)] flex items-center gap-1 hover:underline shrink-0"
          >
            <span>Track Progress</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* TWO-COLUMN BREAKDOWN: ORDER DETAILS + SHIPPING ADDRESS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* ORDER ITEMS LIST (7 COLS) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Order Summary ({items.length} items)</span>
            </h3>

            <div className="divide-y divide-neutral-100">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                      <Image
                        src={item.imageUrl || (item as any).product?.media?.[0]?.url || PLACEHOLDER_IMAGE}
                        alt={item.productName || 'Garment'}
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
                          Size / Variant: {item.variantName}
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

            {/* Total Paid Row */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-600">Total Amount Paid</span>
              <span className="text-base font-extrabold text-[var(--brand-primary)]">
                {formatInr(totalAmount)}
              </span>
            </div>
          </div>

          {/* SHIPPING DESTINATION & PAYMENT INFO (5 COLS) */}
          <div className="md:col-span-5 space-y-5">
            {/* Delivery Destination Card */}
            {shippingAddr && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-2xs space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-100 pb-2.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span>Delivery Destination</span>
                </h3>

                <div className="text-xs space-y-1 text-neutral-700">
                  <p className="font-bold text-neutral-900 text-sm">
                    {shippingAddr.fullName || shippingAddr.name}
                  </p>
                  <p className="leading-relaxed text-neutral-600">
                    {[shippingAddr.addressLine1, shippingAddr.addressLine2, shippingAddr.city, shippingAddr.state]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="font-mono font-bold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 inline-block text-2xs">
                    PIN: {shippingAddr.postalCode || shippingAddr.pincode}
                  </p>
                  {shippingAddr.phone && (
                    <p className="text-neutral-600 font-mono text-[11px] pt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" /> {shippingAddr.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method Badge Card */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Payment Information</span>
              </h3>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-neutral-500">Method:</span>
                <span className="font-bold text-neutral-900 flex items-center gap-1 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {paymentMethod.includes('COD') ? 'Cash on Delivery (COD)' : 'Prepaid (Razorpay UPI / Card)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Payment Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-2xs uppercase">
                  {paymentMethod.includes('COD') ? 'Pending on Delivery' : 'Verified & Paid'}
                </span>
              </div>
            </div>

            {/* Customer Care Box */}
            <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-200 text-center space-y-2">
              <p className="text-xs font-bold text-neutral-900">Need Help With This Order?</p>
              <p className="text-[11px] text-neutral-500">
                Our support team is available Mon–Sat (9 AM – 7 PM).
              </p>
              <Link
                href="/contact"
                className="inline-block text-xs font-bold text-[var(--brand-primary)] hover:underline"
              >
                Contact Customer Support →
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM FULL-WIDTH CONTINUE SHOPPING STRIP */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95"
          >
            <span>Explore More Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
