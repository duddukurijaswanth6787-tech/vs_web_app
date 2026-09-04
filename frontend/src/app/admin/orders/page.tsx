'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderList } from '@/features/orders/order.hooks';
import type { OrderResponse } from '@/features/orders/order.types';
import { OrderStatusBadge, ChannelBadge } from '@/components/feedback/StatusBadges';
import { Search, Eye, FileText, Calendar, Store, Globe, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import { apiClient } from '@/lib/api/client';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const channel = searchParams.get('channel') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const { data: listData, isLoading, isError, refetch } = useOrderList({
    page,
    limit: 10,
    search: search || undefined,
    channel: channel || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleExportManifest = async () => {
    try {
      const res = await apiClient.get('/shipping/delhivery/manifest');
      const manifest = res.data?.data;
      if (!manifest) return;

      const printWin = window.open('', 'ManifestPrint', 'width=800,height=1000');
      if (!printWin) return;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Delhivery Manifest - ${manifest.manifestId}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #111; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; }
            .title { font-size: 20px; font-weight: bold; }
            .meta { margin-top: 16px; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
            .sig-box { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
            .sig-line { border-top: 1px dashed #000; width: 200px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">COURIER DISPATCH MANIFEST</div>
              <div style="font-size: 12px; color: #555;">${manifest.courierPartner}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: monospace; font-size: 16px; font-weight: bold;">${manifest.manifestId}</div>
              <div style="font-size: 12px;">Date: ${manifest.manifestDate}</div>
            </div>
          </div>

          <div class="meta">
            <strong>Pickup Location:</strong> ${manifest.pickupLocation.name}<br>
            <strong>Address:</strong> ${manifest.pickupLocation.address}<br>
            <strong>Contact:</strong> ${manifest.pickupLocation.contact}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Order Ref</th>
                <th>AWB / Waybill</th>
                <th>Customer Name</th>
                <th>Destination</th>
                <th>Payment</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              ${manifest.packages.map((pkg: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${pkg.orderNumber}</strong></td>
                  <td style="font-family: monospace;">${pkg.waybillNumber}</td>
                  <td>${pkg.customerName}</td>
                  <td>${pkg.city} (${pkg.pincode})</td>
                  <td>${pkg.paymentMode}</td>
                  <td>${pkg.weightGrams}g</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 16px; font-size: 13px; text-align: right;">
            <strong>Total Packages:</strong> ${manifest.totalPackages} &nbsp;|&nbsp; 
            <strong>Total Weight:</strong> ${manifest.totalWeightGrams}g
          </div>

          <div class="sig-box">
            <div>
              <div class="sig-line">Warehouse Executive Signature</div>
            </div>
            <div>
              <div class="sig-line">Delhivery Driver Signature & Name</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `);
      printWin.document.close();
    } catch {
      alert('Failed to generate End-of-Day manifest.');
    }
  };

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/orders?${params}`);
  };

  const setDatePreset = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    const now = new Date();
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (preset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      params.set('startDate', start);
      params.delete('endDate');
    } else if (preset === 'YESTERDAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59).toISOString();
      params.set('startDate', start);
      params.set('endDate', end);
    } else if (preset === 'WEEK') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      params.set('startDate', start);
      params.delete('endDate');
    } else if (preset === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      params.set('startDate', start);
      params.delete('endDate');
    } else {
      params.delete('startDate');
      params.delete('endDate');
    }
    router.push(`/admin/orders?${params}`);
  };

  const columns: Column<OrderResponse>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 block">{o.orderNumber}</span>
          {o.createdBy && (
            <span className="text-[10px] text-neutral-400 font-semibold block">Billed: {o.createdBy}</span>
          )}
        </div>
      ),
    },
    { key: 'channel', label: 'Channel', render: (o) => <ChannelBadge channel={o.channel} /> },
    {
      key: 'customerId',
      label: 'Customer',
      render: (o) => {
        const custFirst = o.customer?.user?.firstName || o.customer?.firstName || '';
        const custLast = o.customer?.user?.lastName || o.customer?.lastName || '';
        const name = (custFirst || custLast) ? `${custFirst} ${custLast}`.trim() : 'Walk-in Customer';
        const phone = o.customer?.phone || o.customer?.user?.phone;
        return (
          <div>
            <span className="font-semibold text-neutral-800 text-xs block">{name}</span>
            {phone && <span className="text-[10px] text-neutral-400 font-mono block">{phone}</span>}
          </div>
        );
      },
    },
    { key: 'createdAt', label: 'Date', render: (o) => <span className="text-neutral-600">{formatDate(o.createdAt)}</span> },
    { key: 'items', label: 'Items', render: (o) => <span className="font-semibold text-center block">{o.items?.length || 0}</span> },
    { key: 'subtotal', label: 'Subtotal', render: (o) => <span className="font-mono font-semibold block text-right">{formatMoney(o.subtotal, o.currency)}</span> },
    { key: 'discountTotal', label: 'Discount', render: (o) => <span className="font-mono text-red-500 block text-right">{Number(o.discountTotal) > 0 ? `-${formatMoney(o.discountTotal, o.currency)}` : '—'}</span> },
    { key: 'grandTotal', label: 'Total', render: (o) => <span className="font-mono font-bold text-neutral-950 block text-right">{formatMoney(o.grandTotal, o.currency)}</span> },
    { key: 'status', label: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (o) => (
        <div className="flex justify-end">
          <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition">
            <Eye className="w-3.5 h-3.5" /> Details
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight font-sans">Orders Control Desk</h1>
          <p className="text-xs text-neutral-400 mt-1">Review orders, manage fulfillment status transitions, and inspect financial metrics.</p>
        </div>

        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          View Payments & Analytics Hub <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Date & Channel Preset Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button onClick={() => setDatePreset('ALL')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${!startDate && !endDate ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'}`}>All Time</button>
            <button onClick={() => setDatePreset('TODAY')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition">Today</button>
            <button onClick={() => setDatePreset('YESTERDAY')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition">Yesterday</button>
            <button onClick={() => setDatePreset('WEEK')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition">Last 7 Days</button>
            <button onClick={() => setDatePreset('MONTH')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition">This Month</button>
          </div>

          {/* Quick Channel Presets */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button onClick={() => updateQuery('channel', '')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${!channel ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}>All Channels</button>
            <button onClick={() => updateQuery('channel', 'POS_SHOPORA')} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${channel === 'POS_SHOPORA' ? 'bg-sky-600 text-white shadow-xs' : 'text-neutral-600 hover:text-sky-700'}`}><Store className="w-3 h-3" /> In-Store (POS)</button>
            <button onClick={() => updateQuery('channel', 'ONLINE_STORE')} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${channel === 'ONLINE_STORE' ? 'bg-purple-600 text-white shadow-xs' : 'text-neutral-600 hover:text-purple-700'}`}><Globe className="w-3 h-3" /> Online Web</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full lg:w-80">
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search order number or customer ID..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center justify-end w-full lg:w-auto">
            <form onSubmit={(e) => { e.preventDefault(); updateQuery('startDate', localStartDate); updateQuery('endDate', localEndDate); }} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="date" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs min-h-[38px]" />
                <span className="text-neutral-400 text-xs shrink-0">to</span>
                <input type="date" value={localEndDate} onChange={(e) => setLocalEndDate(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs min-h-[38px]" />
              </div>
              <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shrink-0 min-h-[38px] flex items-center justify-center">Apply</button>
            </form>
            <button
              type="button"
              onClick={handleExportManifest}
              className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 min-h-[38px] flex items-center justify-center gap-1.5 shadow-2xs transition"
            >
              <FileText className="w-3.5 h-3.5" /> 📄 Export End-of-Day Manifest
            </button>
            <select value={status} onChange={(e) => updateQuery('status', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium">
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
