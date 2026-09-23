'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  MapPin,
  CreditCard,
  Download,
  PackageCheck,
  FileText,
  XCircle,
  RotateCcw,
  Star,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useCustomerOrder, useOrderInvoice } from '@/features/customer/hooks';
import { customerOrdersService, type OrderItemDto } from '@/features/customer/orders.service';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { useQueryClient } from '@tanstack/react-query';

const CANCELLATION_REASONS = [
  'Order created by mistake',
  'Found a better price elsewhere',
  'Need to change delivery address / phone number',
  'Expected delivery time is too long',
  'Decided to order different color / size',
  'Other reasons',
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const orderNumber = String(params.id || '');
  const { data: order, isLoading, error } = useCustomerOrder(orderNumber, true);
  const { data: invoiceData } = useOrderInvoice(orderNumber, !!order);

  // Cancel Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [customCancelNotes, setCustomCancelNotes] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

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
  const statusUpper = (order.status || '').toUpperCase();
  const isCancellable = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PAYMENT_PENDING'].includes(statusUpper);
  const isDelivered = statusUpper === 'DELIVERED';
  const isCancelled = statusUpper === 'CANCELLED';

  const handleConfirmCancel = async () => {
    setCancelError('');
    setIsCancelling(true);
    try {
      const fullReason = customCancelNotes ? `${cancelReason} - ${customCancelNotes}` : cancelReason;
      await customerOrdersService.cancel(orderNumber, fullReason);
      setCancelSuccess('Order has been cancelled successfully.');
      qc.invalidateQueries({ queryKey: ['customer', 'order', orderNumber] });
      qc.invalidateQueries({ queryKey: ['customer', 'orders'] });
      setTimeout(() => {
        setShowCancelModal(false);
      }, 1500);
    } catch (err) {
      setCancelError(getApiErrorMessage(err, 'Failed to cancel order'));
    } finally {
      setIsCancelling(false);
    }
  };

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
        <span
          className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
            isCancelled
              ? 'bg-red-50 text-red-700 border-red-200'
              : isDelivered
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-sky-50 text-[var(--brand-primary)] border-sky-100'
          }`}
        >
          {order.status}
        </span>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-5 flex-1 space-y-4 text-xs">
        {/* Cancellation Notice Banner */}
        {isCancelled && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-900 shadow-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <p className="font-bold text-sm text-rose-950">Order Cancelled</p>
                <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                  This order has been cancelled by the boutique.
                </p>
              </div>

              {Boolean((order as any)?.cancelReason) && (
                <div className="bg-white/90 border border-rose-200 rounded-xl p-3 text-2xs space-y-1">
                  <span className="font-bold text-rose-950 uppercase tracking-wider text-[10px] block">Cancellation Reason &amp; Refund Note:</span>
                  <p className="text-neutral-800 leading-relaxed whitespace-pre-line">{String((order as any).cancelReason)}</p>
                </div>
              )}

              <div className="text-2xs text-rose-900 bg-rose-100/70 border border-rose-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <span>💳</span>
                <span><strong>Refund Guarantee:</strong> Any pre-paid amount has been initiated for refund to your source payment method and will reflect within 1 business day.</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Bar */}
        <div className="flex gap-2">
          {!isCancelled && (
            <Link
              href={`/orders/track/${order.orderNumber}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold shadow-xs hover:opacity-95"
            >
              <Truck className="w-4 h-4" /> Track Shipment
            </Link>
          )}

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

          {isCancellable && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}

          {isDelivered && (
            <Link
              href={`/orders/return?orderId=${encodeURIComponent(order.orderNumber)}`}
              className="px-3 py-2.5 bg-sky-50 text-[var(--brand-primary)] border border-sky-200 rounded-xl font-bold hover:bg-sky-100 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" /> Return / Exchange
            </Link>
          )}
        </div>

        {/* Order Items Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b pb-2">Items Ordered</h2>
          <div className="divide-y divide-neutral-100">
            {order.items?.map((item: OrderItemDto) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-900">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-[11px] text-neutral-500">Variant: {item.variantName}</p>
                  )}
                  <p className="text-[11px] text-neutral-500">Quantity: {item.quantity}</p>

                  {isDelivered && item.productId && (
                    <Link
                      href={`/product/${item.productId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-primary)] hover:underline pt-0.5"
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Write Product Review
                    </Link>
                  )}
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

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-base text-neutral-900 font-serif flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" /> Cancel Order #{order.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            {cancelError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {cancelError}
              </p>
            )}

            {cancelSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-emerald-700">{cancelSuccess}</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-xs text-neutral-600">
                  Please select a reason for cancelling this order:
                </p>

                <div className="space-y-1.5">
                  {CANCELLATION_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                        cancelReason === r
                          ? 'border-[var(--brand-primary)] bg-sky-50 font-semibold text-neutral-900'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={cancelReason === r}
                        onChange={() => setCancelReason(r)}
                        className="accent-[var(--brand-primary)]"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  rows={2}
                  placeholder="Additional notes (optional)..."
                  value={customCancelNotes}
                  onChange={(e) => setCustomCancelNotes(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)] text-xs"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2.5 border border-neutral-300 rounded-xl font-bold text-neutral-700 text-xs hover:bg-neutral-50"
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={handleConfirmCancel}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs disabled:opacity-60 transition-colors shadow-xs"
                  >
                    {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}

