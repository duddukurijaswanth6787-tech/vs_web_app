'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInventoryList, useInventorySummary } from '@/features/inventory/inventory.hooks';
import type { InventoryResponse } from '@/features/inventory/inventory.types';
import { StockStatusBadge } from '@/components/feedback/StatusBadges';
import { Sliders, Search, ArrowLeftRight, Activity, TrendingDown, AlertTriangle, Package2 } from 'lucide-react';
import Link from 'next/link';
import StockActionDialog from '@/features/inventory/components/StockActionDialog';
import UpdateInventoryDialog from '@/features/inventory/components/UpdateInventoryDialog';
import { useAuth } from '@/hooks/useAuth';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const page = parseInt(searchParams.get('page') || '1');
  const stockStatus = searchParams.get('stockStatus') || '';
  const search = searchParams.get('search') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [actionItem, setActionItem] = useState<InventoryResponse | null>(null);
  const [settingsItem, setSettingsItem] = useState<InventoryResponse | null>(null);

  const { data: summary, isLoading: isSummaryLoading } = useInventorySummary();
  const { data: listData, isLoading: isListLoading, isError, refetch } = useInventoryList({ page, limit: 10, stockStatus: stockStatus || undefined });

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/inventory?${params}`);
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  const columns: Column<InventoryResponse>[] = [
    { key: 'sku', label: 'SKU', render: (i) => <span className="font-mono font-bold text-[10px] text-neutral-900">{i.variant?.sku || i.variantId.substring(0, 8)}</span> },
    { key: 'variant', label: 'Variant', render: (i) => <div><div className="font-bold text-neutral-900">{i.variant?.title || 'Unknown'}</div><div className="text-[10px] text-neutral-400">ID: {i.variantId}</div></div> },
    { key: 'availableQuantity', label: 'Available', render: (i) => <span className="font-semibold text-neutral-900 text-center block">{i.availableQuantity}</span> },
    { key: 'reservedQuantity', label: 'Reserved', render: (i) => <span className="text-neutral-500 text-center block">{i.reservedQuantity}</span> },
    { key: 'damagedQuantity', label: 'Damaged', render: (i) => <span className="text-red-500 text-center block">{i.damagedQuantity}</span> },
    { key: 'returnedQuantity', label: 'Returned', render: (i) => <span className="text-indigo-500 text-center block">{i.returnedQuantity}</span> },
    { key: 'effective', label: 'Effective', render: (i) => <span className={`font-bold text-center block ${i.availableStock <= 0 ? 'text-red-600' : 'text-neutral-900'}`}>{i.availableStock}</span> },
    { key: 'minmax', label: 'Min/Max', render: (i) => <span className="text-neutral-500 text-center block">{i.minimumStock} <span className="text-neutral-300">/</span> {i.maximumStock}</span> },
    { key: 'reorderLevel', label: 'Reorder', render: (i) => <span className="font-medium text-center block">{i.reorderLevel}</span> },
    { key: 'stockStatus', label: 'Status', render: (i) => <StockStatusBadge status={i.stockStatus} /> },
    ...(isEditor ? [{ key: 'actions' as const, label: 'Actions' as const, render: (i: InventoryResponse) => (
      <div className="flex justify-end gap-2">
        <button onClick={() => setActionItem(i)} className="px-2 py-1 bg-[#800020] text-white rounded text-[10px] font-bold hover:bg-[#600018]">Transact</button>
        <button onClick={() => setSettingsItem(i)} className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-950"><Sliders className="w-3.5 h-3.5" /></button>
      </div>
    )}] : [] as Column<InventoryResponse>[]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#800020] tracking-tight font-sans">Stock Inventory Management</h1>
          <p className="text-xs text-neutral-400 mt-1">Track physical stock, reserve quantities, record damaged items, and configure replenishment levels.</p>
        </div>
        <Link href="/admin/inventory/movements" className="bg-white hover:bg-neutral-50 text-neutral-800 font-semibold py-2.5 px-4 rounded-xl text-xs border border-neutral-200 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" /> Stock Movements
        </Link>
      </div>

      {!isSummaryLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3"><div className="p-2.5 bg-neutral-50 rounded-lg"><Package2 className="w-5 h-5 text-neutral-600" /></div><div><span className="text-[10px] text-neutral-400 font-bold uppercase block">Total SKUs</span><span className="text-lg font-bold text-neutral-900">{summary.totalItems}</span></div></div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3"><div className="p-2.5 bg-green-50 rounded-lg"><Activity className="w-5 h-5 text-green-600" /></div><div><span className="text-[10px] text-green-600/70 font-bold uppercase block">In Stock</span><span className="text-lg font-bold text-green-700">{summary.inStock}</span></div></div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3"><div className="p-2.5 bg-yellow-50 rounded-lg"><TrendingDown className="w-5 h-5 text-yellow-600" /></div><div><span className="text-[10px] text-yellow-600/70 font-bold uppercase block">Low Stock</span><span className="text-lg font-bold text-yellow-700">{summary.lowStock}</span></div></div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3"><div className="p-2.5 bg-red-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div><div><span className="text-[10px] text-red-600/70 font-bold uppercase block">Out of Stock</span><span className="text-lg font-bold text-red-700">{summary.outOfStock}</span></div></div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3"><div className="p-2.5 bg-indigo-50 rounded-lg"><Package2 className="w-5 h-5 text-indigo-600" /></div><div><span className="text-[10px] text-indigo-600/70 font-bold uppercase block">Avail / Reserved</span><span className="text-xs font-bold text-neutral-900">{summary.totalAvailable} <span className="text-neutral-400 font-normal">/</span> {summary.totalReserved}</span></div></div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full md:w-80">
          <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search variant SKU..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#800020]" />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>
        <select value={stockStatus} onChange={(e) => updateQuery('stockStatus', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
          <option value="">All Stock Statuses</option>
          <option value="IN_STOCK">IN STOCK</option>
          <option value="LOW_STOCK">LOW STOCK</option>
          <option value="OUT_OF_STOCK">OUT OF STOCK</option>
          <option value="BACKORDER">BACKORDER</option>
        </select>
      </div>

      <DataTable
        columns={columns as Column<InventoryResponse>[]}
        data={listData?.data ?? []}
        total={listData?.meta?.total ?? 0}
        page={page}
        pageSize={10}
        loading={isListLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/inventory?${params}`); }}
        rowKey={(i) => i.id}
        emptyMessage="No stock listings matching current filter criteria."
      />

      {actionItem && <StockActionDialog inventory={actionItem} onClose={() => { setActionItem(null); refetch(); }} />}
      {settingsItem && <UpdateInventoryDialog inventory={settingsItem} onClose={() => { setSettingsItem(null); refetch(); }} />}
    </div>
  );
}
