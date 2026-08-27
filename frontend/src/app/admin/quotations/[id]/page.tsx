'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer, ShoppingCart, Ban, AlertCircle, Check } from 'lucide-react';
import {
  useQuotation,
  useCancelQuotation,
  useConvertQuotation,
} from '@/features/quotations/quotation.hooks';
import { STATUS_STYLES, formatMoney, money } from '@/features/quotations/quotation.types';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'];

export default function QuotationDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const { data: q, isLoading, error, refetch } = useQuotation(id);
  const convert = useConvertQuotation();
  const cancel = useCancelQuotation();

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [actionError, setActionError] = useState('');
  const [converted, setConverted] = useState(false);

  if (isLoading) return <SectionLoader message="Loading quotation..." />;
  if (error || !q) {
    return <PageError title="Load Failure" message="Could not fetch this quotation." retry={refetch} />;
  }

  const isOpen = q.status !== 'CONVERTED' && q.status !== 'CANCELLED';
  const expired = Boolean(q.validUntil && new Date(q.validUntil).getTime() < Date.now());

  const handleConvert = async () => {
    const paid = parseFloat(amountPaid);
    if (!Number.isFinite(paid) || paid <= 0) {
      return setActionError('Enter the amount the customer paid.');
    }
    if (paid < money(q.grandTotal)) {
      return setActionError(
        `Amount paid is less than the quoted total of ${formatMoney(q.grandTotal)}.`,
      );
    }
    setActionError('');
    try {
      await convert.mutateAsync({ id, paymentMethod, amountPaid: paid });
      setConverted(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not convert this quotation.'));
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel quotation ${q.quotationNumber}?`)) return;
    setActionError('');
    try {
      await cancel.mutateAsync(id);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not cancel this quotation.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Only the quote itself prints; the toolbar and the convert panel are
          screen furniture and would waste a page. */}
      <style>{`@media print {
        .no-print { display: none !important; }
        .print-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; }
      }`}</style>

      <div className="no-print flex flex-wrap items-center gap-3">
        <Link href="/admin/quotations" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 truncate">
            {q.quotationNumber}
          </h1>
        </div>
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${STATUS_STYLES[q.status]}`}>
          {q.status}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          {isOpen && (
            <button
              onClick={handleCancel}
              disabled={cancel.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {converted && (
        <div className="no-print rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold flex items-center gap-2">
            <Check className="w-4 h-4" /> Sold
          </p>
          <p className="mt-1 text-xs">
            The sale is billed at the till and stock has been deducted.
          </p>
        </div>
      )}

      {/* The printable quote */}
      <div className="print-sheet rounded-xl border border-neutral-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-wrap justify-between gap-4 pb-5 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Quotation</h2>
            <p className="text-xs text-neutral-500 mt-1">{q.quotationNumber}</p>
            <p className="text-xs text-neutral-500">
              Issued {new Date(q.createdAt).toLocaleDateString('en-IN')}
            </p>
            {q.validUntil && (
              <p className={`text-xs mt-0.5 ${expired ? 'text-red-600 font-semibold' : 'text-neutral-500'}`}>
                Valid until {new Date(q.validUntil).toLocaleDateString('en-IN')}
                {expired && ' — expired'}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Billed to</p>
            <p className="text-sm font-bold text-neutral-900 mt-1">{q.customerName}</p>
            {q.customerPhone && <p className="text-xs text-neutral-500">{q.customerPhone}</p>}
            {q.customerEmail && <p className="text-xs text-neutral-500">{q.customerEmail}</p>}
          </div>
        </div>

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-xs min-w-150">
            <thead className="text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit</th>
                <th className="text-right py-2">Discount</th>
                <th className="text-right py-2">GST</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {q.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5">
                    <div className="font-medium text-neutral-800">{item.productName}</div>
                    {item.variantTitle && (
                      <div className="text-[11px] text-neutral-400">{item.variantTitle}</div>
                    )}
                    {item.sku && <div className="text-[11px] text-neutral-400">SKU {item.sku}</div>}
                  </td>
                  <td className="py-2.5 text-right">{item.quantity}</td>
                  <td className="py-2.5 text-right">{formatMoney(item.unitPrice)}</td>
                  <td className="py-2.5 text-right text-emerald-700">
                    {money(item.discountAmount) > 0 ? `− ${formatMoney(item.discountAmount)}` : '—'}
                  </td>
                  <td className="py-2.5 text-right">{formatMoney(item.taxAmount)}</td>
                  <td className="py-2.5 text-right font-semibold">{formatMoney(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-5">
          <dl className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatMoney(q.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Bulk discount</dt><dd className="text-emerald-700">− {formatMoney(q.discountTotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">GST</dt><dd>{formatMoney(q.taxTotal)}</dd></div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-bold">
              <dt>Grand total</dt><dd>{formatMoney(q.grandTotal)}</dd>
            </div>
          </dl>
        </div>

        {(q.notes || q.termsText) && (
          <div className="mt-6 pt-5 border-t border-neutral-200 space-y-3 text-xs text-neutral-600">
            {q.notes && <div><span className="font-semibold text-neutral-700">Notes: </span>{q.notes}</div>}
            {q.termsText && <div><span className="font-semibold text-neutral-700">Terms: </span>{q.termsText}</div>}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="no-print rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">Convert to Sale</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Bills this quote at the till and deducts stock. A shift must be open on the register.
          </p>

          {expired && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              This quote is past its valid-until date. Re-price it before selling — the server will
              refuse to honour stale prices.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="pm" className="block text-[11px] font-semibold text-neutral-500 mb-1">
                Payment method
              </label>
              <select
                id="pm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs"
              >
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="paid" className="block text-[11px] font-semibold text-neutral-500 mb-1">
                Amount paid
              </label>
              <input
                id="paid" type="number" min={0} step="0.01" value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={String(money(q.grandTotal))}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleConvert}
                disabled={convert.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                {convert.isPending ? 'Selling…' : 'Convert to Sale'}
              </button>
            </div>
          </div>

          {actionError && (
            <p className="text-xs text-red-600 mt-4 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="min-w-0">{actionError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
