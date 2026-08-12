'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderList } from '@/features/orders/order.hooks';
import type { OrderResponse } from '@/features/orders/order.types';
import { OrderStatusBadge } from '@/components/feedback/StatusBadges';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const { data: listData, isLoading, isError, refetch } = useOrderList({
    page, limit: 10, search: search || undefined,
    status: status || undefined, startDate: startDate || undefined, endDate: endDate || undefined,
  });

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/orders?${params}`);
  };

  const columns: Column<OrderResponse>[] = [
    { key: 'orderNumber', label: 'Order #', render: (o) => <span className="font-mono font-bold text-neutral-900">{o.orderNumber}</span> },
    { key: 'customerId', label: 'Customer', render: (o) => <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[120px] block">{o.customerId}</span> },
    { key: 'createdAt', label: 'Date', render: (o) => <span className="text-neutral-600">{formatDate(o.createdAt)}</span> },
    { key: 'items', label: 'Items', render: (o) => <span className="font-semibold text-center block">{o.items?.length || 0}</span> },
    { key: 'subtotal', label: 'Subtotal', render: (o) => <span className="font-mono font-semibold block text-right">{formatMoney(o.subtotal, o.currency)}</span> },
    { key: 'discountTotal', label: 'Discount', render: (o) => <span className="font-mono text-red-500 block text-right">-{formatMoney(o.discountTotal, o.currency)}</span> },
    { key: 'grandTotal', label: 'Total', render: (o) => <span className="font-mono font-bold text-neutral-950 block text-right">{formatMoney(o.grandTotal, o.currency)}</span> },
    { key: 'status', label: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
    { key: 'actions', label: 'Actions', render: (o) => (
      <div className="flex justify-end">
        <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition">
          <Eye className="w-3.5 h-3.5" /> Details
        </Link>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Orders Control Desk</h1>
          <p className="text-xs text-neutral-400 mt-1">Review orders, manage fulfillment status transitions, and inspect financial metrics.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full md:w-80">
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search by order number or customer ID..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>
          <div className="flex flex-wrap gap-3 items-center justify-end">
            <form onSubmit={(e) => { e.preventDefault(); updateQuery('startDate', localStartDate); updateQuery('endDate', localEndDate); }} className="flex gap-2 items-center">
              <input type="date" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1 text-2xs" />
              <span className="text-neutral-400 text-2xs">to</span>
              <input type="date" value={localEndDate} onChange={(e) => setLocalEndDate(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1 text-2xs" />
              <button type="submit" className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 text-2xs font-semibold">Apply</button>
            </form>
            <select value={status} onChange={(e) => updateQuery('status', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PACKING">PACKING</option>
              <option value="READY_TO_SHIP">READY TO SHIP</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="RETURN_REQUESTED">RETURN REQUESTED</option>
              <option value="RETURN_APPROVED">RETURN APPROVED</option>
              <option value="RETURN_COMPLETED">RETURN COMPLETED</option>
            </select>
          </div>
        </div>
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
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/orders?${params}`); }}
        rowKey={(o) => o.id}
        emptyMessage="No orders found matching the filter selection."
      />
    </div>
  );
}
