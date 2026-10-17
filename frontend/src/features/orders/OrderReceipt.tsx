'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, RefreshCw, Package, MapPin, CreditCard, ArrowLeft, Truck } from 'lucide-react';
import { useCustomerOrder } from '@/features/customer/hooks';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { getOrderPresentation } from './order-state';
import { OrderPaymentRetry } from './OrderPaymentRetry';

export function OrderReceipt() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const { data: order, isLoading, error, refetch, isFetching } = useCustomerOrder(orderNumber, true);
  const state = order ? getOrderPresentation({ ...order, grandTotal: Number(order.grandTotal ?? order.totalAmount) }) : null;
  const address = (order?.shippingAddress || (order?.addresses as Array<Record<string, string>> | undefined)?.find((a) => a.addressType === 'SHIPPING')) as Record<string, string> | undefined;
  const timeline = (order?.timeline as { id?: string; status: string; message?: string; createdAt: string }[] | undefined) || [];
  const tone = state?.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : state?.tone === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-neutral-200 bg-neutral-50 text-neutral-800';

  return <div className="min-h-screen bg-[var(--page-bg)] pb-20 text-neutral-900">
    <StorefrontHeader />
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600"><ArrowLeft size={16} /> My orders</Link>
      {isLoading && !order ? <div role="status" className="rounded-2xl border bg-white p-8 text-center"><Clock className="mx-auto mb-3" /> Checking your order…</div>
      : !order || !state ? <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 space-y-3">
        <h1 className="text-xl font-semibold">Unable to load this order</h1><p>{getApiErrorMessage(error, 'Check your account or refresh this page.')}</p>
        <button type="button" onClick={() => refetch()} className="rounded-lg border px-4 py-2">Try again</button>
      </div> : <>
        <section className={`rounded-2xl border p-5 sm:p-7 ${tone}`}>
          <div className="flex items-start gap-4">
            {state.tone === 'success' ? <CheckCircle2 className="mt-1 shrink-0" size={28} /> : <Clock className="mt-1 shrink-0" size={28} />}
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider">Order {order.orderNumber}</p>
              <h1 className="text-xl sm:text-2xl font-semibold">{state.title}</h1>
              <p className="max-w-2xl text-sm leading-relaxed">{state.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-lg border border-current/20 bg-white/70 px-3 py-2 text-sm font-medium"><RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Check status</button>
                {!state.cancelled && !state.pending && <Link href={`/orders/track/${order.orderNumber}`} className="inline-flex items-center gap-2 rounded-lg border border-current/20 bg-white/70 px-3 py-2 text-sm font-medium"><Truck size={15} /> Track order</Link>}
              </div>
              {state.canRetry && <div className="pt-3"><OrderPaymentRetry order={{ ...order, grandTotal: state.total }} onRefresh={refetch} /></div>}
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 font-semibold"><Package size={18} /> Your items</h2>
            {(order.items || []).map((item) => <div key={item.id} className="flex justify-between gap-3 border-b border-neutral-100 pb-3 text-sm">
              <div><p className="font-medium">{item.productName}</p><p className="mt-1 text-neutral-500">Quantity {item.quantity} · {formatInr(Number(item.unitPrice))} each{item.variantName ? ` · ${item.variantName}` : ''}</p></div>
              <p className="shrink-0 font-medium">{formatInr(Number(item.totalPrice))}</p>
            </div>)}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatInr(Number(order.subtotal))}</dd></div>
              {Number(order.discountTotal || 0) > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>−{formatInr(Number(order.discountTotal))}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.shippingCharge) > 0 ? formatInr(Number(order.shippingCharge)) : 'Free'}</dd></div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>Order total</dt><dd>{formatInr(state.total)}</dd></div>
              <div className="flex justify-between text-neutral-600"><dt>Payment received</dt><dd>{formatInr(state.paidAmount)}</dd></div>
              {Number(order.refundedAmount || 0) > 0 && <div className="flex justify-between text-neutral-600"><dt>Refund completed</dt><dd>{formatInr(Number(order.refundedAmount))}</dd></div>}
            </dl>
          </section>
          <div className="space-y-4">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <h2 className="flex items-center gap-2 font-semibold"><CreditCard size={18} /> Payment</h2>
              <p className="text-sm font-medium">{state.paymentLabel}</p>
              <p className="text-sm text-neutral-600">{state.cod ? 'Cash on delivery' : 'Online payment via Razorpay'}</p>
              {Number(order.refundDue || 0) > 0 && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Refund awaiting action: {formatInr(Number(order.refundDue))}</p>}
            </section>
            {address && <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2">
              <h2 className="flex items-center gap-2 font-semibold"><MapPin size={18} /> Delivery address</h2>
              <p className="text-sm font-medium">{address.fullName}</p><p className="text-sm leading-relaxed text-neutral-600">{[address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode].filter(Boolean).join(', ')}</p><p className="text-sm text-neutral-600">{address.phone}</p>
            </section>}
          </div>
        </div>
        {timeline.length > 0 && <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Order updates</h2>
          <ol className="space-y-4">{[...timeline].reverse().map((entry, index) => <li key={entry.id || index} className="border-l-2 border-neutral-200 pl-4 text-sm">
            <p className="font-medium">{entry.status.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}</p>
            {entry.message && <p className="mt-1 text-neutral-600">{entry.message}</p>}
            <p className="mt-1 text-xs text-neutral-500">{new Date(entry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</p>
          </li>)}</ol>
        </section>}
        <p className="text-center text-sm text-neutral-600">Need help? <Link href="/contact" className="font-medium text-[var(--brand-primary)] underline">Contact customer support</Link></p>
      </>}
    </main>
    <StorefrontFooter /><MobileBottomNav />
  </div>;
}
