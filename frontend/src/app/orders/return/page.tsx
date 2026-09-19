'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { useCustomerOrders } from '@/features/customer/hooks';
import { customerOrdersService, OrderDto } from '@/features/customer/orders.service';
import { getApiErrorMessage } from '@/utils/api-error';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';

const RETURN_REASONS = [
  'Size / Fit Issue (Too Large or Small)',
  'Fabric Quality Not as Expected',
  'Defective or Damaged Product Received',
  'Wrong Item Delivered',
  'Color / Shade Differed from Photos',
  'Found a Better Price Elsewhere',
];

const EXCHANGE_REASONS = [
  'Too Small / Tight - Need 1 Size Larger',
  'Too Large / Loose - Need 1 Size Smaller',
  'Prefer Different Color / Variant',
  'Fit issue in Sleeves / Neckline',
  'Exchange for Same Item (Defect Replacement)',
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Custom Stitched'];

const REFUND_PREFERENCES = [
  { id: 'ORIGINAL_PAYMENT', label: 'Original Payment Method', desc: 'Refund to source card/UPI' },
  { id: 'WALLET', label: 'Vasanthi Wallet Credit', desc: 'Instant store credit balance' },
  { id: 'BANK_TRANSFER', label: 'Bank Account Transfer', desc: 'NEFT to bank account' },
  { id: 'STORE_CREDIT', label: 'Store Credit Voucher', desc: 'Digital discount voucher' },
];

function OrderReturnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');
  const initialMode = searchParams.get('mode') === 'exchange' ? 'EXCHANGE' : 'EXCHANGE';
  const { data: orderData, isLoading: ordersLoading } = useCustomerOrders();
  const orders: OrderDto[] = Array.isArray(orderData)
    ? orderData
    : (orderData as unknown as { data?: OrderDto[] })?.data || [];

  const [requestMode, setRequestMode] = useState<'EXCHANGE' | 'RETURN'>('EXCHANGE');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(preselectedOrderId || '');
  const [selectedReason, setSelectedReason] = useState<string>(EXCHANGE_REASONS[0]);
  const [targetSize, setTargetSize] = useState<string>('L');
  const [refundPreference, setRefundPreference] = useState<string>('ORIGINAL_PAYMENT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setErrorMsg('Please select an order to proceed.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const finalReason = requestMode === 'EXCHANGE'
        ? `[EXCHANGE: Target Size ${targetSize}] - ${selectedReason}`
        : selectedReason;

      await customerOrdersService.createReturn({
        orderId: selectedOrder?.id || selectedOrderId,
        reason: finalReason,
        refundPreference: requestMode === 'EXCHANGE' ? 'STORE_CREDIT' : refundPreference,
        notes: requestMode === 'EXCHANGE' ? `Exchange requested for size: ${targetSize}. ${notes}` : notes,
      });

      setSuccessMsg(
        requestMode === 'EXCHANGE'
          ? `Your size exchange request for size ${targetSize} has been submitted! Our team will arrange doorstep exchange pick-up.`
          : 'Your return request has been submitted successfully!'
      );
      setTimeout(() => {
        router.push('/orders');
      }, 2500);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Failed to submit request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/orders" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-700" />
        </Link>
        <h1 className="text-base font-bold font-serif text-[var(--brand-primary)]">
          {requestMode === 'EXCHANGE' ? 'Request Size / Color Exchange' : 'Request Order Return'}
        </h1>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* Dual Mode Switcher Tab */}
        <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setRequestMode('EXCHANGE');
              setSelectedReason(EXCHANGE_REASONS[0]);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              requestMode === 'EXCHANGE'
                ? 'bg-white text-[var(--brand-primary)] shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Exchange Size / Color</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRequestMode('RETURN');
              setSelectedReason(RETURN_REASONS[0]);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              requestMode === 'RETURN'
                ? 'bg-white text-[var(--brand-primary)] shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-sky-600" />
            <span>Return for Refund</span>
          </button>
        </div>

        {/* Header Notice */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[var(--brand-primary)] font-bold text-sm font-serif">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>
              {requestMode === 'EXCHANGE'
                ? 'Free Doorstep Size Exchange'
                : 'Hassle-Free 7-Day Returns'}
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {requestMode === 'EXCHANGE'
              ? 'Ordered the wrong size? Pick your desired replacement size below. Courier will deliver the new size and collect the old item right from your doorstep.'
              : 'Select your delivered order below. Courier will pick up the item and your refund will be processed directly to your preferred account.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Select Order */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 block">Select Delivered Order *</label>
            {ordersLoading ? (
              <div className="p-3 text-xs text-neutral-400 font-medium">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500 space-y-2">
                <Package className="w-6 h-6 mx-auto text-neutral-300" />
                <p>No recent orders found in your account.</p>
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:border-[var(--brand-primary)] bg-white font-medium text-neutral-800"
              >
                <option value="">-- Choose Order --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.orderNumber} (₹{(o.totalAmount || o.subtotal || 0).toLocaleString('en-IN')}) — {o.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* If Exchange: Select Desired Replacement Size */}
          {requestMode === 'EXCHANGE' && (
            <div className="space-y-2 p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
              <label className="text-xs font-extrabold text-amber-950 block">
                Select Required Replacement Size *
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTargetSize(size)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      targetSize === size
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-300'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 block">
              {requestMode === 'EXCHANGE' ? 'Reason for Exchange *' : 'Reason for Return *'}
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:border-[var(--brand-primary)] bg-white font-medium text-neutral-800"
            >
              {(requestMode === 'EXCHANGE' ? EXCHANGE_REASONS : RETURN_REASONS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Refund Preference (Only for Returns) */}
          {requestMode === 'RETURN' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-800 block">Refund Preference</label>
              <div className="space-y-2">
                {REFUND_PREFERENCES.map((pref) => (
                  <label
                    key={pref.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      refundPreference === pref.id
                        ? 'border-[var(--brand-primary)] bg-sky-50/40'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundPreference"
                      value={pref.id}
                      checked={refundPreference === pref.id}
                      onChange={(e) => setRefundPreference(e.target.value)}
                      className="mt-0.5 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{pref.label}</div>
                      <div className="text-[10px] text-neutral-500">{pref.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 block">Additional Notes / Instructions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide any extra details for the delivery courier or warehouse team..."
              className="w-full text-xs border border-neutral-200 rounded-xl p-3 outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedOrderId}
            className={`w-full text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
              requestMode === 'EXCHANGE'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]'
            }`}
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : requestMode === 'EXCHANGE' ? (
              <span>Submit Size Exchange Request (Free)</span>
            ) : (
              <span>Submit Return Request</span>
            )}
          </button>
        </form>
      </main>
      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
export default function OrderReturnPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading return portal...</div>}>
      <OrderReturnForm />
    </Suspense>
  );
}
