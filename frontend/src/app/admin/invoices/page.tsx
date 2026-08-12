'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvoiceList } from '@/features/invoices/invoice.hooks';
import type { InvoiceResponse } from '@/features/invoices/invoice.types';
import { InvoiceStatusBadge } from '@/components/feedback/StatusBadges';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';

  const { data: listData, isLoading, isError, refetch } = useInvoiceList({ page, limit: 10, status: status || undefined });

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/invoices?${params}`);
  };

  const columns: Column<InvoiceResponse>[] = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (i) => <span className="font-mono font-bold text-neutral-900">{i.invoiceNumber}</span> },
    { key: 'orderId', label: 'Order', render: (i) => <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[155px] block">{i.orderId}</span> },
    { key: 'createdAt', label: 'Date', render: (i) => <span className="text-neutral-600">{formatDate(i.createdAt)}</span> },
    { key: 'taxTotal', label: 'Tax', render: (i) => <span className="font-mono font-semibold block text-right">{formatMoney(i.taxTotal, i.currency)}</span> },
    { key: 'discountTotal', label: 'Discount', render: (i) => <span className="font-mono text-red-500 block text-right">-{formatMoney(i.discountTotal, i.currency)}</span> },
    { key: 'grandTotal', label: 'Total', render: (i) => <span className="font-mono font-bold text-neutral-950 block text-right">{formatMoney(i.grandTotal, i.currency)}</span> },
    { key: 'status', label: 'Status', render: (i) => <InvoiceStatusBadge status={i.status} /> },
    { key: 'actions', label: 'Actions', render: (i) => (
      <div className="flex justify-end">
        <Link href={`/admin/invoices/${i.id}`} className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition">
          <Eye className="w-3.5 h-3.5" /> View Slip
        </Link>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Invoices Archive</h1>
          <p className="text-xs text-neutral-400 mt-1">Review legal customer invoices, check billing tax information, and download invoice records.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
        <span className="text-xs font-semibold text-neutral-500">Filters:</span>
        <select value={status} onChange={(e) => updateQuery('status', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="UNPAID">UNPAID</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={listData?.data ?? []}
        total={listData?.meta?.total ?? 0}
        page={page}
        pageSize={10}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/invoices?${params}`); }}
        rowKey={(i) => i.id}
        emptyMessage="No invoices found in registry."
      />
    </div>
  );
}
