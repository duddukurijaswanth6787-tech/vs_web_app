'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/lib/permissions/rules';
import {
  useCreatePosReturn,
  useCreatePosExchange,
  useCurrentShift,
  useReturnableSale,
  useScanBarcode,
  useSearchPosProducts,
} from '@/features/pos/pos.hooks';
import { useTerminalId } from '@/features/pos/terminal';
import type { PosRefundMethod, PosPaymentMethod, PosReturnResult, PosExchangeResult, ExchangeNewItem } from '@/features/pos/pos.types';
import { getApiErrorMessage } from '@/utils/api-error';
import { preventNegativeKeys, sanitizeNonNegativeNumber } from '@/utils/validators';

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
  const [exchangeReceipt, setExchangeReceipt] = useState<PosExchangeResult | null>(null);

  // Exchange-mode state: whether the panel is on, what's being scanned/added,
  // and how the new sale side gets paid. Everything server-priced, no trust in
  // client numbers.
  const [mode, setMode] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [scanInput, setScanInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newItems, setNewItems] = useState<ExchangeNewItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('CARD');

  const saleQuery = useReturnableSale(searchedOrder);
  const returnMutation = useCreatePosReturn();
  const exchangeMutation = useCreatePosExchange();
  const scanMutation = useScanBarcode();
  // Debounced pass to typed search: same as the till's rules.
  const productSearch = useSearchPosProducts(searchTerm);
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

  const newSaleTotal = useMemo(
    () =>
      newItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [newItems],
  );
  // Positive = customer pays extra; negative = shop gives change; 0 = clean swap.
  const netDue = Math.round((newSaleTotal - refundTotal) * 100) / 100;

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

  const addNewItem = (scan: {
    productId: string;
    productName: string;
    variantId?: string;
    sku?: string;
    variantTitle?: string;
    price: number;
    availableStock: number;
  }) => {
    setNewItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.variantId === scan.variantId || (i.sku && i.sku === scan.sku),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          productId: scan.productId,
          productName: scan.productName,
          variantId: scan.variantId,
          sku: scan.sku,
          variantTitle: scan.variantTitle,
          unitPrice: scan.price,
          quantity: 1,
        },
      ];
    });
    setScanInput('');
    setSearchTerm('');
  };

  const handleScanForExchange = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = scanInput.trim();
    if (!value) return;
    // Digits only: scan by barcode. Anything else: switch to search suggestions.
    if (/^\d+$/.test(value)) {
      scanMutation.mutate(value, {
        onSuccess: (data) => addNewItem(data),
        onError: (err) =>
          setError(getApiErrorMessage(err, `No product found for "${value}".`)),
      });
    } else {
      setSearchTerm(value);
    }
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

    if (mode === 'EXCHANGE') {
      if (newItems.length === 0) {
        setError('Add at least one replacement item.');
        return;
      }
      try {
        const result = await exchangeMutation.mutateAsync({
          originalOrderNumber: sale.orderNumber,
          returnItems: selected,
          newItems,
          refundMethod,
          paymentMethod,
          reason: reason.trim(),
          terminalId,
        });
        setExchangeReceipt(result);
        setReceipt(null);
        setQuantities({});
        setNewItems([]);
        setReason('');
      } catch (err) {
        setError(getApiErrorMessage(err, 'Could not complete the exchange.'));
      }
      return;
    }

    try {
      const result = await returnMutation.mutateAsync({
        orderNumber: sale.orderNumber,
        items: selected,
        refundMethod,
        reason: reason.trim(),
        terminalId,
      });
      setReceipt(result);
      setExchangeReceipt(null);
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
    <div className="min-h-screen bg-[var(--page-bg)] text-neutral-900">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <Link href="/pos" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--brand-primary)]">Returns</h1>
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

        <div className="flex gap-2">
          {(['RETURN', 'EXCHANGE'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError('');
                setExchangeReceipt(null);
                setReceipt(null);
              }}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold border ${
                mode === m
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {m === 'RETURN' ? 'Return only' : 'Exchange (swap for another)'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            placeholder="Scan or type the order number from the receipt"
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
          />
          <button
            type="submit"
            className="px-5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold flex items-center gap-2"
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

        {exchangeReceipt && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> Exchange complete
            </p>
            <p>
              Return {exchangeReceipt.returnNumber} · New sale {exchangeReceipt.newOrderNumber}
            </p>
            <p>
              Returned {rupees(exchangeReceipt.refundAmount)} · New{' '}
              {rupees(exchangeReceipt.newSaleTotal)} ·{' '}
              {exchangeReceipt.netDue > 0
                ? `Customer paid extra ${rupees(exchangeReceipt.netDue)} by ${exchangeReceipt.paymentMethod}`
                : exchangeReceipt.netDue < 0
                  ? `Refunded ${rupees(-exchangeReceipt.netDue)} by ${exchangeReceipt.refundMethod}`
                  : 'Clean swap, no cash changed hands'}
            </p>
          </div>
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
                          onKeyDown={preventNegativeKeys}
                          disabled={item.returnableQuantity === 0}
                          value={quantities[item.orderItemId] ?? 0}
                          onChange={(e) =>
                            setQty(
                              item.orderItemId,
                              sanitizeNonNegativeNumber(e.target.value),
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

            {mode === 'EXCHANGE' && (
              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <h3 className="text-sm font-bold text-neutral-800">Replacement items</h3>

                <form onSubmit={handleScanForExchange} className="flex gap-2">
                  <input
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan barcode or type product name..."
                    className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={scanMutation.isPending || !scanInput.trim()}
                    className="px-4 rounded-xl bg-neutral-900 text-white text-sm font-bold disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>

                {searchTerm && (productSearch.data?.length ?? 0) > 0 && (
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    {productSearch.data!.slice(0, 6).map((p) => (
                      <button
                        key={p.variantId || p.productId}
                        type="button"
                        onClick={() => addNewItem(p)}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 border-b last:border-b-0 flex items-center justify-between text-xs"
                      >
                        <span>
                          <span className="font-bold">{p.productName}</span>
                          {p.variantTitle ? ` - ${p.variantTitle}` : ''}
                          <span className="text-neutral-500 ml-2">
                            ({p.availableStock} in stock)
                          </span>
                        </span>
                        <span className="font-bold">{rupees(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {newItems.length > 0 && (
                  <div className="space-y-1">
                    {newItems.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2 text-xs"
                      >
                        <span>
                          <span className="font-bold">{it.productName}</span>
                          {it.variantTitle ? ` - ${it.variantTitle}` : ''} × {it.quantity}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-bold">{rupees(it.unitPrice * it.quantity)}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-neutral-400 hover:text-red-600"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <label className="block text-sm">
                  <span className="font-semibold text-neutral-700">Charge extra by</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PosPaymentMethod)}
                    className="w-full mt-1 rounded-xl border border-neutral-300 px-3 py-2.5 bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                  </select>
                  <span className="block text-[11px] text-neutral-500 mt-1">
                    Only used when the exchange leaves the customer owing extra.
                  </span>
                </label>
              </div>
            )}

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
              <div className="text-sm space-y-0.5">
                <p><span className="text-neutral-500">Return credit</span> <span className="font-bold">{rupees(refundTotal)}</span></p>
                {mode === 'EXCHANGE' && (
                  <>
                    <p><span className="text-neutral-500">New sale</span> <span className="font-bold">{rupees(newSaleTotal)}</span></p>
                    <p className={`text-lg font-bold ${netDue > 0 ? 'text-sky-800' : netDue < 0 ? 'text-emerald-700' : 'text-neutral-700'}`}>
                      {netDue > 0
                        ? `Customer pays ${rupees(netDue)}`
                        : netDue < 0
                          ? `Give ${rupees(-netDue)} back`
                          : 'Even swap'}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={
                  (mode === 'RETURN' ? returnMutation.isPending : exchangeMutation.isPending) ||
                  selected.length === 0 ||
                  shiftRequired ||
                  (mode === 'EXCHANGE' && newItems.length === 0)
                }
                className="px-6 py-3 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {mode === 'EXCHANGE'
                  ? exchangeMutation.isPending
                    ? 'Exchanging...'
                    : 'Complete Exchange'
                  : returnMutation.isPending
                    ? 'Refunding...'
                    : 'Complete Return'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
