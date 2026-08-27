'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Trash2, AlertCircle } from 'lucide-react';
import { useProducts } from '@/features/catalog/products/product.hooks';
import { useCreateQuotation } from '@/features/quotations/quotation.hooks';
import { formatMoney } from '@/features/quotations/quotation.types';
import { getApiErrorMessage } from '@/utils/api-error';

interface Line {
  key: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

/**
 * Mirrors the server's arithmetic so the figure on screen is the figure that
 * gets saved. The server stays the authority -- this only avoids quoting a
 * customer a number the backend will then disagree with.
 */
const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

function lineTotals(l: Line) {
  const sub = money(l.quantity * l.unitPrice);
  const discount = money((sub * l.discountPercent) / 100);
  const taxable = money(sub - discount);
  const tax = money((taxable * l.taxPercent) / 100);
  return { sub, discount, tax, total: money(taxable + tax) };
}

export default function NewQuotationPage() {
  const router = useRouter();
  const createQuotation = useCreateQuotation();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [termsText, setTermsText] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data: products } = useProducts({ search: search || undefined, limit: 8 });

  const totals = useMemo(() => {
    const computed = lines.map(lineTotals);
    return {
      subtotal: money(computed.reduce((s, c) => s + c.sub, 0)),
      discount: money(computed.reduce((s, c) => s + c.discount, 0)),
      tax: money(computed.reduce((s, c) => s + c.tax, 0)),
      grand: money(computed.reduce((s, c) => s + c.total, 0)),
    };
  }, [lines]);

  const addProduct = (p: Record<string, unknown>) => {
    const variants = (p.variants as Array<Record<string, unknown>>) || [];
    const first = variants[0];
    setLines((prev) => [
      ...prev,
      {
        key: `${p.id as string}-${Date.now()}`,
        productId: p.id as string,
        variantId: first?.id as string | undefined,
        productName: (p.name as string) || 'Unnamed product',
        variantTitle: first?.title as string | undefined,
        sku: (first?.sku as string) || (p.sku as string) || '',
        quantity: 1,
        unitPrice: Number(first?.price ?? p.price ?? 0),
        discountPercent: 0,
        taxPercent: 0,
      },
    ]);
    setSearch('');
  };

  const patch = (key: string, changes: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));

  const handleSave = async (status: 'DRAFT' | 'SENT') => {
    if (!customerName.trim()) return setError('Enter the customer name.');
    if (!lines.length) return setError('Add at least one product.');
    setError('');
    try {
      const created = await createQuotation.mutateAsync({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        validUntil: validUntil || undefined,
        notes: notes.trim() || undefined,
        termsText: termsText.trim() || undefined,
        status,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          productName: l.productName,
          variantTitle: l.variantTitle,
          sku: l.sku,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent,
          taxPercent: l.taxPercent,
        })),
      });
      router.push(`/admin/quotations/${created.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the quotation.'));
    }
  };

  const input =
    'w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/quotations" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            New Quotation
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            No stock is held while this quote is open.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900 mb-4">Customer</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="qname" className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Name *
            </label>
            <input id="qname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="qphone" className="block text-[11px] font-semibold text-neutral-500 mb-1">Phone</label>
            <input id="qphone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="qemail" className="block text-[11px] font-semibold text-neutral-500 mb-1">Email</label>
            <input id="qemail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="qvalid" className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Valid until
            </label>
            <input id="qvalid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={input} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900 mb-4">Products</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products to add…"
            className={`${input} pl-9`}
          />
          {search && (products?.data?.length ?? 0) > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {(products?.data ?? []).map((p) => (
                <button
                  key={p.id as string}
                  onClick={() => addProduct(p as unknown as Record<string, unknown>)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-neutral-50 flex items-center gap-2 border-b border-neutral-50 last:border-0"
                >
                  <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{p.name as string}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!lines.length ? (
          <p className="text-xs text-neutral-400 py-8 text-center">
            No products yet. Search above to add the first line.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-175">
              <thead className="text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2 w-20">Qty</th>
                  <th className="text-right py-2 w-28">Unit ₹</th>
                  <th className="text-right py-2 w-24">Disc %</th>
                  <th className="text-right py-2 w-24">GST %</th>
                  <th className="text-right py-2 w-28">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {lines.map((l) => {
                  const t = lineTotals(l);
                  return (
                    <tr key={l.key}>
                      <td className="py-2 pr-2">
                        <div className="font-medium text-neutral-800">{l.productName}</div>
                        {l.variantTitle && (
                          <div className="text-[11px] text-neutral-400">{l.variantTitle}</div>
                        )}
                      </td>
                      <td className="py-2">
                        <input
                          type="number" min={1} value={l.quantity} aria-label="Quantity"
                          onChange={(e) => patch(l.key, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                          className={`${input} text-right`}
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <input
                          type="number" min={0} step="0.01" value={l.unitPrice} aria-label="Unit price"
                          onChange={(e) => patch(l.key, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className={`${input} text-right`}
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <input
                          type="number" min={0} max={100} value={l.discountPercent} aria-label="Discount percent"
                          onChange={(e) => patch(l.key, { discountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                          className={`${input} text-right`}
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <input
                          type="number" min={0} max={100} value={l.taxPercent} aria-label="GST percent"
                          onChange={(e) => patch(l.key, { taxPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                          className={`${input} text-right`}
                        />
                      </td>
                      <td className="py-2 text-right font-semibold text-neutral-900">
                        {formatMoney(t.total)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                          aria-label={`Remove ${l.productName}`}
                          className="p-1 text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm space-y-3">
          <div>
            <label htmlFor="qnotes" className="block text-[11px] font-semibold text-neutral-500 mb-1">Notes</label>
            <textarea id="qnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="qterms" className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Terms printed on the quote
            </label>
            <textarea id="qterms" rows={3} value={termsText} onChange={(e) => setTermsText(e.target.value)} className={input} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Summary</h2>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Bulk discount</dt><dd className="text-emerald-700">− {formatMoney(totals.discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">GST</dt><dd>{formatMoney(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-bold">
              <dt>Grand total</dt><dd>{formatMoney(totals.grand)}</dd>
            </div>
          </dl>

          {error && (
            <p className="text-xs text-red-600 mt-4 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="min-w-0">{error}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={createQuotation.isPending}
              className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave('SENT')}
              disabled={createQuotation.isPending}
              className="flex-1 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {createQuotation.isPending ? 'Saving…' : 'Save & Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
