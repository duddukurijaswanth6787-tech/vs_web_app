'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, X } from 'lucide-react';
import { useQuotations } from '@/features/quotations/quotation.hooks';
import {
  STATUS_STYLES,
  formatMoney,
  type QuotationStatus,
} from '@/features/quotations/quotation.types';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const STATUSES: (QuotationStatus | '')[] = [
  '',
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'CONVERTED',
  'CANCELLED',
];

export default function QuotationsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuotations({ status, search, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Quotations</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Priced offers for bulk in-store buyers. Nothing is reserved until a quote is sold.
          </p>
        </div>
        <Link
          href="/admin/quotations/new"
          className="inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> New Quotation
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:flex-1 sm:min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by number, customer or phone…"
            className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-8 py-2.5 text-xs focus:outline-none focus:border-neutral-400"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={status}
          aria-label="Filter by status"
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="flex-1 sm:flex-none bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SectionLoader message="Loading quotations..." />
      ) : error ? (
        <PageError title="Load Failure" message="Could not fetch quotations." retry={refetch} />
      ) : !data?.data.length ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-neutral-200 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-neutral-500">No quotations yet</p>
          <Link
            href="/admin/quotations/new"
            className="inline-block mt-3 bg-neutral-900 text-white rounded-xl px-4 py-2 text-xs font-bold"
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs min-w-150">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">Number</th>
                  <th className="text-left px-4 py-3 font-bold">Customer</th>
                  <th className="text-left px-4 py-3 font-bold">Items</th>
                  <th className="text-right px-4 py-3 font-bold">Total</th>
                  <th className="text-left px-4 py-3 font-bold">Status</th>
                  <th className="text-left px-4 py-3 font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.data.map((q) => (
                  <tr key={q.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/admin/quotations/${q.id}`} className="hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-neutral-800">{q.customerName}</div>
                      {q.customerPhone && (
                        <div className="text-[11px] text-neutral-400">{q.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{q.items.length}</td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                      {formatMoney(q.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${STATUS_STYLES[q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(q.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-neutral-200 px-4 py-3 shadow-sm">
              <p className="text-xs text-neutral-500">{data.meta.total} quotations</p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30 hover:bg-neutral-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 text-xs text-neutral-600">
                  Page {page} of {data.meta.totalPages}
                </span>
                <button
                  disabled={!data.meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30 hover:bg-neutral-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
