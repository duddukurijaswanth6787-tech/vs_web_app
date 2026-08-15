'use client';

import React, { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCreateExportJob, useListReport } from '@/features/reports';
import type { ReportType } from '@/features/reports/reports.types';
import {
  ShoppingBag, Users, Package, ShoppingCart, RefreshCw, CheckCircle2,
  Tag, RotateCcw, CreditCard, Percent, Truck, Layers, Star, FileText,
  ArrowLeft, Download,
} from 'lucide-react';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const reportTypes: { id: ReportType; title: string; group: string; icon: React.ElementType; color: string }[] = [
  { id: 'SALES', title: 'Sales', group: 'Financial', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'PAYMENTS', title: 'Payments', group: 'Financial', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'TAX', title: 'Tax', group: 'Financial', icon: Percent, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { id: 'ORDER', title: 'Orders', group: 'Operations', icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'SHIPPING', title: 'Shipping', group: 'Operations', icon: Truck, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
  { id: 'RETURNS', title: 'Returns', group: 'Operations', icon: RotateCcw, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { id: 'INVENTORY', title: 'Inventory', group: 'Catalog', icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { id: 'PRODUCTS', title: 'Products', group: 'Catalog', icon: FileText, color: 'text-violet-600 bg-violet-50 border-violet-100' },
  { id: 'CATEGORIES', title: 'Categories', group: 'Catalog', icon: Layers, color: 'text-pink-600 bg-pink-50 border-pink-100' },
  { id: 'BRANDS', title: 'Brands', group: 'Catalog', icon: Tag, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
  { id: 'CUSTOMER', title: 'Customers', group: 'People', icon: Users, color: 'text-teal-600 bg-teal-50 border-teal-100' },
  { id: 'COUPONS', title: 'Coupons', group: 'Promotions', icon: Tag, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { id: 'REVIEWS', title: 'Reviews', group: 'People', icon: Star, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
];

const groups = [...new Set(reportTypes.map((r) => r.group))];

const PAGE_SIZE = 50;

type ReportItem = { id?: string; [key: string]: string | number | boolean | null | undefined | Record<string, unknown> | Array<Record<string, unknown>> };

type ReportColumn = { key: string; label: string; render: (item: ReportItem) => React.ReactNode };

const periodPresets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

// ponytail: shared column config; add more columns per type as needed
function getColumns(type: string): ReportColumn[] {
  const cols: Record<string, ReportColumn[]> = {
    PRODUCTS: [
      { key: 'name', label: 'Name', render: (i) => <span className="font-medium">{String(i.name ?? '')}</span> },
      { key: 'sku', label: 'SKU', render: (i) => String(i.sku ?? '') },
      { key: 'basePrice', label: 'Price', render: (i) => formatCurrency(Number(i.basePrice || 0)) },
      { key: 'status', label: 'Status', render: (i) => <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{String(i.status ?? '')}</span> },
      { key: 'variants', label: 'Variants', render: (i) => String((i._count as Record<string, unknown>)?.variants ?? '-') },
    ],
    COUPONS: [
      { key: 'code', label: 'Code', render: (i) => <span className="font-mono font-medium">{String(i.code ?? '')}</span> },
      { key: 'name', label: 'Name', render: (i) => String(i.name ?? '') },
      { key: 'type', label: 'Type', render: (i) => String(i.type ?? '') },
      { key: 'value', label: 'Value', render: (i) => `${i.type === 'PERCENTAGE' ? i.value + '%' : formatCurrency(Number(i.value))}` },
      { key: 'isActive', label: 'Active', render: (i) => i.isActive ? '✓' : '✗' },
      { key: 'usedCount', label: 'Used', render: (i) => String(i.usedCount ?? '') },
    ],
    RETURNS: [
      { key: 'returnNumber', label: 'Return #', render: (i) => String(i.returnNumber ?? '') },
      { key: 'order', label: 'Order', render: (i) => String((i.order as Record<string, unknown>)?.orderNumber ?? '-') },
      { key: 'reason', label: 'Reason', render: (i) => <span className="max-w-[200px] truncate block">{String(i.reason ?? '')}</span> },
      { key: 'status', label: 'Status', render: (i) => <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{String(i.status ?? '')}</span> },
    ],
    PAYMENTS: [
      { key: 'paymentNumber', label: 'Payment #', render: (i) => String(i.paymentNumber ?? '') },
      { key: 'order', label: 'Order', render: (i) => String((i.order as Record<string, unknown>)?.orderNumber ?? '-') },
      { key: 'method', label: 'Method', render: (i) => String(i.method ?? '') },
      { key: 'amount', label: 'Amount', render: (i) => formatCurrency(Number(i.amount)) },
      { key: 'status', label: 'Status', render: (i) => <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{String(i.status ?? '')}</span> },
    ],
    TAX: [
      { key: 'orderNumber', label: 'Order', render: (i) => String(i.orderNumber ?? '') },
      { key: 'taxTotal', label: 'Tax', render: (i) => formatCurrency(Number(i.taxTotal || 0)) },
      { key: 'grandTotal', label: 'Total', render: (i) => formatCurrency(Number(i.grandTotal)) },
      { key: 'status', label: 'Status', render: (i) => String(i.status ?? '') },
    ],
    SHIPPING: [
      { key: 'orderNumber', label: 'Order', render: (i) => String(i.orderNumber ?? '') },
      { key: 'shippingCharge', label: 'Shipping', render: (i) => formatCurrency(Number(i.shippingCharge || 0)) },
      { key: 'grandTotal', label: 'Total', render: (i) => formatCurrency(Number(i.grandTotal)) },
      { key: 'status', label: 'Status', render: (i) => String(i.status ?? '') },
    ],
    CATEGORIES: [
      { key: 'name', label: 'Name', render: (i) => <span className="font-medium">{String(i.name ?? '')}</span> },
      { key: 'status', label: 'Status', render: (i) => String(i.status ?? '') },
      { key: 'products', label: 'Products', render: (i) => String((i._count as Record<string, unknown>)?.productMappings ?? '-') },
    ],
    BRANDS: [
      { key: 'name', label: 'Name', render: (i) => <span className="font-medium">{String(i.name ?? '')}</span> },
      { key: 'status', label: 'Status', render: (i) => String(i.status ?? '') },
      { key: 'products', label: 'Products', render: (i) => String((i._count as Record<string, unknown>)?.products ?? '-') },
    ],
    REVIEWS: [
      { key: 'product', label: 'Product', render: (i) => String((i.product as Record<string, unknown>)?.name ?? '-') },
      { key: 'rating', label: 'Rating', render: (i) => '★'.repeat(Number(i.rating || 0)) + '☆'.repeat(5 - Number(i.rating || 0)) },
      { key: 'status', label: 'Status', render: (i) => <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">{String(i.status ?? '')}</span> },
      { key: 'comment', label: 'Comment', render: (i) => <span className="max-w-[250px] truncate block">{String(i.comment || '-')}</span> },
    ],
  };
  return cols[type] || [];
}

function ReportView({ type, onBack }: { type: string; onBack: () => void }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [presetLabel, setPresetLabel] = useState('');
  const createExport = useCreateExportJob();
  const [exportMsg, setExportMsg] = useState('');

  const { data, isLoading, isError, refetch } = useListReport(type, startDate || undefined, endDate || undefined, page);

  const applyPreset = useCallback((days: number, label: string) => {
    if (days === 0) {
      const d = new Date();
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(d.toISOString().slice(0, 10));
    } else {
      const from = new Date();
      from.setDate(from.getDate() - days);
      setStartDate(from.toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
    setPresetLabel(label);
    setPage(1);
  }, []);

  const handleExport = async () => {
    try {
      await createExport.mutateAsync({ type: type as ReportType, format: 'CSV', startDate, endDate });
      setExportMsg('Export queued! Check Export Jobs.');
      setTimeout(() => setExportMsg(''), 5000);
    } catch { setExportMsg('Export failed'); }
  };

  const columns = getColumns(type);
  const listData = data?.data as { items?: ReportItem[]; total?: number } | undefined;
  const items = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const re = reportTypes.find((r) => r.id === type);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-lg font-bold text-neutral-900">{re?.title ?? type} Report</h1>
          <p className="text-xs text-neutral-500">{total} records</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
        {periodPresets.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p.days, p.label)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${presetLabel === p.label ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>
            {p.label}
          </button>
        ))}
        <div className="h-5 w-px bg-neutral-200 mx-1" />
        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPresetLabel(''); setPage(1); }}
          className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white" />
        <span className="text-xs text-neutral-400">to</span>
        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPresetLabel(''); setPage(1); }}
          className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white" />
        <div className="flex-1" />
        <button onClick={handleExport} disabled={createExport.isPending}
          className="text-xs font-medium text-white bg-neutral-950 rounded-lg px-4 py-2 hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
        <Link href="/admin/reports/exports" className="text-xs text-neutral-500 hover:text-neutral-700 underline">Export Jobs</Link>
        {exportMsg && <span className="text-xs text-green-600">{exportMsg}</span>}
      </div>

      {isLoading ? <SectionLoader message="Loading report..." /> :
       isError ? <PageError title="Error" message="Could not load report" retry={refetch} /> :
       !items.length ? <EmptyState title="No Data" description="No records found for this period" /> : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>{columns.map((c) => <th key={c.key} className="text-left px-4 py-3 font-bold text-neutral-500">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item, i) => (
                <tr key={item.id ?? i} className="hover:bg-neutral-50">
                  {columns.map((c) => <td key={c.key} className="px-4 py-3 text-neutral-700">{c.render(item)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-neutral-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-neutral-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30 hover:bg-neutral-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30 hover:bg-neutral-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeType = searchParams.get('type');
  const createExport = useCreateExportJob();
  const [exportMsg, setExportMsg] = useState('');

  if (activeType) {
    return <ReportView type={activeType.toUpperCase()} onBack={() => router.push('/admin/reports')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4 border-neutral-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Report Center</h1>
          <p className="text-sm text-neutral-500 mt-1">Detailed historical reports with filtering and CSV export.</p>
        </div>
        <Link href="/admin/reports/exports" className="text-xs font-bold text-neutral-900 border border-neutral-300 rounded px-3.5 py-2 hover:bg-neutral-50 transition flex items-center gap-1.5 bg-white shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" /> Export Jobs
        </Link>
      </div>

      {exportMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />{exportMsg}
        </div>
      )}

      {groups.map((group) => (
        <div key={group}>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">{group}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reportTypes.filter((r) => r.group === group).map((rep) => {
              const Icon = rep.icon;
              const dedicatedPageSlugs: Partial<Record<ReportType, string>> = {
                SALES: 'sales',
                ORDER: 'orders',
                INVENTORY: 'inventory',
                CUSTOMER: 'customers',
              };
              const dedicatedSlug = dedicatedPageSlugs[rep.id];
              const href = dedicatedSlug ? `/admin/reports/${dedicatedSlug}` : `/admin/reports?type=${rep.id}`;
              return (
                <div key={rep.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
                  <div className={`rounded-lg border p-2 ${rep.color}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900">{rep.title}</h3>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={href} className="text-xs font-medium text-white bg-neutral-950 rounded-lg px-3 py-1.5 hover:bg-neutral-800">View</Link>
                    <button onClick={async () => {
                      try {
                        await createExport.mutateAsync({ type: rep.id, format: 'CSV' });
                        setExportMsg(`${rep.title} export queued!`);
                        setTimeout(() => setExportMsg(''), 5000);
                      } catch {}
                    }} disabled={createExport.isPending} className="text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50">
                      CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<SectionLoader message="Loading..." />}>
      <ReportCenterContent />
    </Suspense>
  );
}
