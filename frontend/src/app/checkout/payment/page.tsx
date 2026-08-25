'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { usePaymentMethods, usePlaceOrder, useCheckoutPreview } from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/features/payments/payment.service';
import type { OrderPlacePaymentDto } from '@/features/customer/checkout.service';

interface PaymentMethod {
  code: string;
  title: string;
  description?: string;
}

const COUPON_STORAGE_KEY = 'vd_coupon_code';

function CheckoutPaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = searchParams.get('addressId') || '';
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: methods, isLoading } = usePaymentMethods();
  const placeOrder = usePlaceOrder();
  const [selected, setSelected] = useState('cod');
  const [payError, setPayError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [couponCode] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem(COUPON_STORAGE_KEY)) || '',
  );
  const { data: preview } = useCheckoutPreview(addressId, couponCode || undefined);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/checkout/payment" className="text-sm font-bold text-[#0284c7]">
          Login required
        </Link>
      </div>
    );
  }

  const openRazorpayCheckout = (payment: OrderPlacePaymentDto, orderNumber: string) => {
    if (!window.Razorpay) {
      setPayError('Payment gateway failed to load. Please refresh and try again.');
      return;
    }
    const rzp = new window.Razorpay({
      key: payment.razorpayKeyId,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency,
      order_id: payment.providerOrderId,
      name: "Vasanthi's Signature",
      description: `Order ${orderNumber}`,
      handler: (response) => {
        setVerifying(true);
        paymentService
          .verify(payment.paymentId, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          .then(() => {
            router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
          })
          .catch((err: unknown) => {
            setVerifying(false);
            setPayError(
              getApiErrorMessage(err, 'Payment verification failed. Contact support if money was deducted.'),
            );
          });
      },
      modal: {
        ondismiss: () => setPayError('Payment cancelled. You can try again below.'),
      },
      theme: { color: '#0284c7' },
    });
    rzp.open();
  };

  const onPay = async () => {
    if (!addressId) {
      router.push('/checkout/address');
      return;
    }
    setPayError('');
    try {
      const paymentMethod = selected === 'razorpay' ? 'RAZORPAY' : 'COD';
      const order = await placeOrder.mutateAsync({
        addressId,
        shippingMethod: 'STANDARD',
        couponCode: couponCode || undefined,
        paymentMethod,
      });
      if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);

      if (order.payment) {
        openRazorpayCheckout(order.payment, order.orderNumber);
        return;
      }

      const orderNumber = order?.orderNumber || order?.id || '';
      router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    } catch (err) {
      setPayError(getApiErrorMessage(err, 'Payment / order failed'));
    }
  };

  const isBusy = placeOrder.isPending || verifying;

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/checkout/address" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Payment</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {payError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {payError}
          </p>
        )}
        {preview && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{formatInr(Number(preview.subtotal))}</span>
            </div>
            {couponCode && Number(preview.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon ({couponCode})</span>
                <span>-{formatInr(Number(preview.discountTotal))}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Tax</span>
              <span>{formatInr(Number(preview.taxTotal))}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Shipping</span>
              <span>{Number(preview.shippingCharge) === 0 ? 'FREE' : formatInr(Number(preview.shippingCharge))}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1.5 border-t border-neutral-100">
              <span>Total</span>
              <span className="text-[#0284c7]">{formatInr(Number(preview.grandTotal))}</span>
            </div>
          </div>
        )}

        {isLoading && <p className="text-sm text-neutral-500">Loading payment methods…</p>}
        {((methods || []) as unknown as PaymentMethod[]).map((m) => (
          <button
            key={m.code}
            type="button"
            onClick={() => setSelected(m.code)}
            className={`w-full text-left bg-white border rounded-2xl p-4 ${
              selected === m.code ? 'border-[#0284c7] bg-rose-50/40' : 'border-neutral-200'
            }`}
          >
            <p className="text-sm font-bold">{m.title}</p>
            <p className="text-xs text-neutral-500 mt-1">{m.description}</p>
          </button>
        ))}

        <button
          type="button"
          disabled={isBusy || !addressId}
          onClick={onPay}
          className="w-full bg-[#0284c7] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-60"
        >
          {verifying ? 'Confirming payment…' : placeOrder.isPending ? 'Processing…' : 'Confirm & Place Order'}
        </button>
      </main>
      <StorefrontFooter />
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans">Loading...</div>}>
      <CheckoutPaymentPageContent />
    </React.Suspense>
  );
}
