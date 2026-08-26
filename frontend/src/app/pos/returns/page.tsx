'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/lib/permissions/rules';
import {
  useCreatePosReturn,
  useCurrentShift,
  useReturnableSale,
} from '@/features/pos/pos.hooks';
import { useTerminalId } from '@/features/pos/terminal';
import type { PosRefundMethod, PosReturnResult } from '@/features/pos/pos.types';
import { getApiErrorMessage } from '@/utils/api-error';

const REFUND_METHODS: { value: PosRefundMethod; label: string }[] = [
  { value: 'ORIGINAL', label: 'Same as payment' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
];

const rupees = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PosReturnsPage() {
  const { user } = useAuth();
  const canUsePos = hasPermission(user, 'pos:view');

  const { terminalId, isResolved: terminalResolved } = useTerminalId();
  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift(
    terminalId,
    terminalResolved,
  );
  // A refund takes money out of a drawer, so there has to be a shift counting
  // it -- same rule the server enforces.
  const shiftRequired = terminalResolved && !shiftLoading && !currentShift;

  const [orderInput, setOrderInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<PosRefundMethod>('ORIGINAL');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PosReturnResult | null>(null);

  const saleQuery = useReturnableSale(searchedOrder);
  const returnMutation = useCreatePosReturn();
  const sale = saleQuery.data;

  const selected = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
    [quantities],
  );

  const refundTotal = useMemo(() => {
    if (!sale) return 0;
    return selected.reduce((sum, sel) => {
      const item = sale.items.find((i) => i.orderItemId === sel.orderItemId);
      return sum + (item ? item.unitRefund * sel.quantity : 0);
    }, 0);
  }, [sale, selected]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReceipt(null);
    setQuantities({});
    setSearchedOrder(orderInput.trim());
  };

  const setQty = (orderItemId: string, qty: number, max: number) => {
    const clamped = Math.max(0, Math.min(qty, max));
    setQuantities((prev) => ({ ...prev, [orderItemId]: clamped }));
  };

  const handleSubmit = async () => {
    if (!sale || selected.length === 0) {
      setError('Select at least one item to return.');
      return;
    }
    if (!reason.trim()) {
      setError('Enter a reason for the return.');
      return;
    }
    setError('');
    try {
      const result = await returnMutation.mutateAsync({
        orderNumber: sale.orderNumber,
        items: selected,
        refundMethod,
        reason: reason.trim(),
        terminalId,
      });
      setReceipt(result);
      setQuantities({});
      setReason('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not complete the return.'));
    }
  };

  if (!canUsePos) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
        You do not have access to the till.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] text-neutral-900">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <Link href="/pos" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-[#0284c7]">Returns</h1>
        {terminalResolved && (
          <span className="ml-auto text-xs text-neutral-500">{terminalId}</span>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {shiftRequired && (
          <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3">
            No shift is open on this register. Open one from the till before
            refunding, so the payout is counted when the drawer is reconciled.
          </p>
        )}

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            placeholder="Scan or type the order number from the receipt"
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30"
          />
          <button
            type="submit"
            className="px-5 rounded-xl bg-[#0284c7] text-white text-sm font-bold flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Find
          </button>
        </form>

        {saleQuery.isLoading && (
          <p className="text-sm text-neutral-500">Looking up the sale…</p>
        )}
        {saleQuery.isError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {getApiErrorMessage(saleQuery.error, 'No sale found for that number.')}
          </p>
        )}

        {receipt && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> Return {receipt.returnNumber} completed
            </p>
            <p className="mt-1">
              {rupees(receipt.refundAmount)} refunded by {receipt.refundMethod} ·{' '}
              {receipt.itemsReturned} item(s) back in stock
            </p>
          </div>
        )}

        {sale && (
          <section className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <div>
                <p className="font-bold">{sale.orderNumber}</p>
                <p className="text-neutral-500 text-xs">
                  Sold {new Date(sale.soldAt).toLocaleString()} · paid by{' '}
                  {sale.paymentMethod}
                </p>
              </div>
              <p className="font-semibold">{rupees(sale.grandTotal)}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-125">
                <thead className="text-xs text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Returnable</th>
                    <th className="text-right py-2">Per unit</th>
                    <th className="text-right py-2">Return qty</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.orderItemId} className="border-b border-neutral-100">
                      <td className="py-2.5">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-neutral-500">
                          {item.variantTitle || item.sku}
                          {item.alreadyReturned > 0 &&
                            ` · ${item.alreadyReturned} already returned`}
                        </p>
                      </td>
                      <td className="text-right">{item.returnableQuantity}</td>
                      <td className="text-right">{rupees(item.unitRefund)}</td>
                      <td className="text-right">
                        <input
                          type="number"
                          min={0}
                          max={item.returnableQuantity}
                          disabled={item.returnableQuantity === 0}
                          value={quantities[item.orderItemId] ?? 0}
                          onChange={(e) =>
                            setQty(
                              item.orderItemId,
                              parseInt(e.target.value || '0', 10),
                              item.returnableQuantity,
                            )
                          }
                          className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-right disabled:bg-neutral-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-neutral-700">Refund by</span>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as PosRefundMethod)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 bg-white"
                >
                  {REFUND_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-neutral-700">Reason</span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Wrong size, damaged, changed mind…"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
              <div className="text-sm">
                <span className="text-neutral-500">Refund total</span>
                <p className="text-xl font-bold">{rupees(refundTotal)}</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={
                  returnMutation.isPending || selected.length === 0 || shiftRequired
                }
                className="px-6 py-3 rounded-xl bg-[#0284c7] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {returnMutation.isPending ? 'Refunding…' : 'Complete Return'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
