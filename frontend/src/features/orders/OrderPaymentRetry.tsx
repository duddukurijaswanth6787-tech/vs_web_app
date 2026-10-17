'use client';
import { useState } from 'react';
import Script from 'next/script';
import { paymentService } from '@/features/payments/payment.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { OrderStateInput } from './order-state';

export function OrderPaymentRetry({ order, onRefresh }: { order: OrderStateInput & { id: string; orderNumber: string }; onRefresh: () => unknown }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const retry = async () => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      if (!window.Razorpay) throw new Error('Payment gateway is loading. Please try again in a moment.');
      const payment = await paymentService.create({ orderId: order.id, method: 'RAZORPAY', provider: 'razorpay', amount: Number(order.amountDue ?? order.grandTotal ?? order.totalAmount) });
      const gateway = new window.Razorpay({ key: payment.razorpayKeyId || '', order_id: payment.providerOrderId || '', amount: Math.round(payment.amount * 100),
        currency: payment.currency, name: "Vasanthi's Signature", description: `Order ${order.orderNumber}`,
        modal: { ondismiss: () => { setBusy(false); setMessage('Payment was not completed. Your existing order is available to retry.'); } },
        handler: async (result) => {
          try {
            const verified = await paymentService.verify(payment.id, { razorpayPaymentId: result.razorpay_payment_id, razorpaySignature: result.razorpay_signature });
            setMessage(verified.status === 'CAPTURED' ? 'Payment received. Refreshing your order…' : 'Payment is still processing. Please check the status before paying again.');
          } catch (err) { setMessage(getApiErrorMessage(err, 'We could not confirm this payment yet. Check the status before paying again.')); }
          finally { setBusy(false); onRefresh(); }
        } });
      gateway.open();
    } catch (err) { setMessage(getApiErrorMessage(err, 'Unable to open payment for this order.')); setBusy(false); onRefresh(); }
  };
  return <div className="space-y-2">
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <button type="button" disabled={busy} onClick={retry} className="rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
      {busy ? 'Checking payment…' : 'Complete payment for this order'}
    </button>
    {message && <p role="status" className="text-sm text-neutral-700">{message}</p>}
  </div>;
}
