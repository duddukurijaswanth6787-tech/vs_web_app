'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, Search, X, CheckCircle2, Clock, Ban, Eye } from 'lucide-react';
import { useQuotations, useCreateQuotation } from '@/features/quotations/quotation.hooks';
import {
  STATUS_STYLES,
  formatMoney,
  type QuotationStatus,
  type Quotation,
} from '@/features/quotations/quotation.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const STATUSES: (QuotationStatus | '')[] = [
  '',
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'CONVERTED',
  'CANCELLED',
];

export default function PosQuotationsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const { data, isLoading, error, refetch } = useQuotations({ status, search, page });

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans pb-12">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/pos" className="p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--brand-primary)]">POS Quotations &amp; Proforma Invoices</h1>
            <p className="text-[11px] text-neutral-500 hidden sm:block">Create, search and manage customer proforma quotations at the till.</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by quote number, customer name or phone..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-[var(--brand-primary)]"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full sm:w-48 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--brand-primary)] font-bold text-neutral-700"
          >
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <SectionLoader message="Loading quotations list..." />
        ) : error ? (
          <PageError title="Load Failure" message="Could not load quotations." retry={refetch} />
        ) : !data?.data.length ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">No Quotations Found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              No quotations have been recorded yet. Click &quot;Create Quotation&quot; to build a custom bulk price quote for a customer.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-4 py-2 text-xs font-bold transition"
            >
              Create Quotation Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Quote #</th>
                      <th className="text-left px-4 py-3">Customer</th>
                      <th className="text-left px-4 py-3">Items</th>
                      <th className="text-right px-4 py-3">Total Amount</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-right px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800 font-medium">
                    {data.data.map((q) => (
                      <tr key={q.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[var(--brand-primary)]">
                          {q.quotationNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-neutral-900">{q.customerName}</div>
                          {q.customerPhone && (
                            <div className="text-[10px] text-neutral-400 font-mono">{q.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {q.items.length} item(s)
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">
                          {formatMoney(q.grandTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[q.status]}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-[11px]">
                          {new Date(q.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedQuotation(q)}
                            className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded-lg text-2xs font-bold transition"
                          >
                            <Eye className="w-3 h-3" /> View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-neutral-200 px-4 py-3 shadow-2xs text-xs">
                <span className="text-neutral-500">Total {data.meta.total} quotations</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 border border-neutral-200 rounded-lg text-xs disabled:opacity-40 hover:bg-neutral-50"
                  >
                    Previous
                  </button>
                  <span className="px-2 py-1 font-semibold text-neutral-700">Page {page} of {data.meta.totalPages}</span>
                  <button
                    disabled={!data.meta.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 border border-neutral-200 rounded-lg text-xs disabled:opacity-40 hover:bg-neutral-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE QUOTATION DIALOG */}
      {isCreateOpen && (
        <CreateQuotationModal onClose={() => setIsCreateOpen(false)} onSuccess={() => refetch()} />
      )}

      {/* VIEW QUOTATION DETAIL DIALOG */}
      {selectedQuotation && (
        <ViewQuotationModal quotation={selectedQuotation} onClose={() => setSelectedQuotation(null)} />
      )}
    </div>
  );
}

function CreateQuotationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Sample items state for quick quotation draft
  const [items, setItems] = useState<Array<{ productName: string; sku: string; quantity: number; unitPrice: number }>>([
    { productName: 'Custom Designer Saree', sku: 'VSS-SAR-001', quantity: 1, unitPrice: 4500 },
  ]);

  const createMut = useCreateQuotation();

  const addItem = () => {
    setItems((prev) => [...prev, { productName: 'Designer Item', sku: `SKU-${Date.now().toString().slice(-4)}`, quantity: 1, unitPrice: 2000 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePriceChange = (idx: number, price: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx].unitPrice = Math.max(0, price);
      return next;
    });
  };

  const handleQtyChange = (idx: number, qty: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx].quantity = Math.max(1, qty);
      return next;
    });
  };

  const handleNameChange = (idx: number, name: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx].productName = name;
      return next;
    });
  };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one item to the quotation.');
      return;
    }
    setError('');

    try {
      await createMut.mutateAsync({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: '00000000-0000-0000-0000-000000000000',
          productName: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create quotation.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Create New POS Quotation</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in / Client Name"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10 digits"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-neutral-500">Quotation Line Items</span>
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Line Item
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <input
                  type="text"
                  value={it.productName}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  placeholder="Item Name"
                  className="flex-1 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-bold text-neutral-900 focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => handleQtyChange(idx, parseInt(e.target.value || '1', 10))}
                  className="w-16 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-bold text-center"
                />
                <input
                  type="number"
                  min="0"
                  value={it.unitPrice}
                  onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value || '0'))}
                  className="w-24 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-bold text-right"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-neutral-400 hover:text-red-600 p-1"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-neutral-100 p-3 rounded-xl font-bold text-xs">
            <span>Subtotal Estimate</span>
            <span className="font-mono text-sm text-[var(--brand-primary)]">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Remarks / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Valid for 7 days. Subject to availability."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center gap-1.5"
            >
              {createMut.isPending && <ButtonLoader />} Save Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewQuotationModal({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Quotation {quotation.quotationNumber}</h3>
            <p className="text-[10px] text-neutral-400">Created {new Date(quotation.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-1">
            <div className="font-bold text-neutral-900">{quotation.customerName}</div>
            {quotation.customerPhone && <div className="text-[11px] font-mono text-neutral-500">Phone: {quotation.customerPhone}</div>}
            {quotation.customerEmail && <div className="text-[11px] text-neutral-500">Email: {quotation.customerEmail}</div>}
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold uppercase text-neutral-500">Items</span>
            {quotation.items.map((i, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white border border-neutral-200 p-2 rounded-lg text-xs">
                <div>
                  <div className="font-bold text-neutral-900">{i.productName}</div>
                  <div className="text-[10px] text-neutral-400">{i.quantity} × ₹{Number(i.unitPrice)}</div>
                </div>
                <div className="font-bold font-mono">₹{i.quantity * Number(i.unitPrice)}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-neutral-900 text-white p-3 rounded-xl font-bold">
            <span>Grand Total</span>
            <span className="font-mono text-sm">₹{Number(quotation.grandTotal).toLocaleString('en-IN')}</span>
          </div>

          {quotation.notes && (
            <div className="text-[11px] text-neutral-500 italic bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
              Note: {quotation.notes}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
