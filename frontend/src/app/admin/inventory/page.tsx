'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useInventoryList,
  useInventorySummary,
  useIncreaseStock,
} from '@/features/inventory/inventory.hooks';
import type { InventoryResponse } from '@/features/inventory/inventory.types';
import { StockStatusBadge } from '@/components/feedback/StatusBadges';
import {
  Sliders,
  Search,
  ArrowLeftRight,
  Activity,
  TrendingDown,
  AlertTriangle,
  Package2,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import StockActionDialog from '@/features/inventory/components/StockActionDialog';
import UpdateInventoryDialog from '@/features/inventory/components/UpdateInventoryDialog';
import QuickAddStockDialog from '@/features/inventory/components/QuickAddStockDialog';
import { useAuth } from '@/hooks/useAuth';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const stockStatus = searchParams.get('stockStatus') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [actionItem, setActionItem] = useState<InventoryResponse | null>(null);
  const [settingsItem, setSettingsItem] = useState<InventoryResponse | null>(null);
  const [quickAddItem, setQuickAddItem] = useState<InventoryResponse | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickIncrementId, setQuickIncrementId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useInventorySummary();
  const {
    data: listData,
    isLoading: isListLoading,
    isError,
    refetch: refetchList,
  } = useInventoryList({
    page,
    limit: 50,
    stockStatus: stockStatus || undefined,
  });

  const increaseMut = useIncreaseStock();

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/inventory?${params}`);
  };

  const isEditor = user?.roles?.some((r) => ['super_admin', 'admin'].includes(r));
  const inventories = listData?.data ?? [];

  // Filter dynamic list based on search query (SKU, title, product name, barcode)
  const filteredInventories = useMemo(() => {
    if (!searchQuery.trim()) return inventories;
    const q = searchQuery.toLowerCase().trim();
    return inventories.filter((i) => {
      const sku = i.variant?.sku?.toLowerCase() || '';
      const title = i.variant?.title?.toLowerCase() || '';
      const productName = i.variant?.productName?.toLowerCase() || '';
      const barcode = i.variant?.barcode?.toLowerCase() || '';
      return (
        sku.includes(q) ||
        title.includes(q) ||
        productName.includes(q) ||
        barcode.includes(q) ||
        i.variantId.toLowerCase().includes(q)
      );
    });
  }, [inventories, searchQuery]);

  // Quick 1-click increment handler (+10 or +25)
  const handleQuickAddUnits = async (item: InventoryResponse, qty: number) => {
    setQuickIncrementId(item.id);
    setBannerNotice(null);
    try {
      await increaseMut.mutateAsync({
        id: item.id,
        dto: {
          quantity: qty,
          reason: 'Quick Counter / Warehouse Inbound Stock (+)',
          remarks: `1-click stock restock (+${qty})`,
        },
      });
      setBannerNotice({
        type: 'success',
        text: `✅ Added +${qty} units to SKU: ${item.variant?.sku || item.variantId}. New Stock: ${item.availableQuantity + qty}`,
      });
      refetchList();
      refetchSummary();
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        text: `⚠️ Could not add stock: ${err?.message || 'Server error'}`,
      });
    } finally {
      setQuickIncrementId(null);
    }
  };

  const columns: Column<InventoryResponse>[] = [
    {
      key: 'variant',
      label: 'Product & Variant SKU',
      render: (i) => (
        <div className="space-y-1 max-w-[260px]">
          <div className="font-bold text-xs text-neutral-900 truncate" title={i.variant?.productName || 'Product'}>
            {i.variant?.productName || 'Catalog Product'}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-black text-2xs px-1.5 py-0.5 rounded bg-neutral-900 text-white">
              {i.variant?.sku || i.variantId.substring(0, 8)}
            </span>
            <span className="text-2xs font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
              {i.variant?.title || 'Variant'}
            </span>
            {i.variant?.barcode && (
              <span className="text-[9px] font-mono text-neutral-400">
                BAR: {i.variant.barcode}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'availableQuantity',
      label: 'Available Stock',
      render: (i) => (
        <div className="text-center">
          <span
            className={`font-mono font-black text-sm block ${
              i.availableQuantity <= 0
                ? 'text-red-600'
                : i.availableQuantity <= 10
                ? 'text-amber-600'
                : 'text-emerald-700'
            }`}
          >
            {i.availableQuantity}
          </span>
          <span className="text-[9px] text-neutral-400 block font-medium">Sellable</span>
        </div>
      ),
    },
    {
      key: 'reservedQuantity',
      label: 'Reserved',
      render: (i) => (
        <div className="text-center">
          <span className="font-mono font-bold text-xs text-neutral-600 block">
            {i.reservedQuantity}
          </span>
          <span className="text-[9px] text-neutral-400 block">In Orders</span>
        </div>
      ),
    },
    {
      key: 'stockStatus',
      label: 'Stock Status',
      render: (i) => <StockStatusBadge status={i.stockStatus} />,
    },
    {
      key: 'minmax',
      label: 'Min / Max (Reorder)',
      render: (i) => (
        <div className="text-center font-mono text-2xs text-neutral-600">
          <span>
            {i.minimumStock} <span className="text-neutral-300">/</span> {i.maximumStock}
          </span>
          <span className="text-[9px] text-neutral-400 block">Reorder @ {i.reorderLevel}</span>
        </div>
      ),
    },
    ...(isEditor
      ? ([
          {
            key: 'actions',
            label: 'Quick Stock In & Adjust',
            render: (i: InventoryResponse) => (
              <div className="flex items-center justify-end gap-1.5">
                {/* 1-Click +10 Button */}
                <button
                  onClick={() => handleQuickAddUnits(i, 10)}
                  disabled={quickIncrementId === i.id}
                  title="Add +10 units instantly"
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-mono font-bold text-[10px] rounded-lg border border-emerald-200 transition disabled:opacity-50"
                >
                  {quickIncrementId === i.id ? <ButtonLoader /> : '+10'}
                </button>

                {/* 1-Click +25 Button */}
                <button
                  onClick={() => handleQuickAddUnits(i, 25)}
                  disabled={quickIncrementId === i.id}
                  title="Add +25 units instantly"
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-mono font-bold text-[10px] rounded-lg border border-emerald-200 transition disabled:opacity-50"
                >
                  +25
                </button>

                {/* Modal Stock In Button */}
                <button
                  onClick={() => {
                    setQuickAddItem(i);
                    setIsQuickAddOpen(true);
                  }}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-2xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" /> Add Stock
                </button>

                {/* Advanced Transact Button */}
                <button
                  onClick={() => setActionItem(i)}
                  title="Advanced stock adjustment (Decrease, Override, Damage, Return)"
                  className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-2xs font-semibold transition"
                >
                  Adjust
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => setSettingsItem(i)}
                  title="Configure threshold settings"
                  className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ] as Column<InventoryResponse>[])
      : []),
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package2 className="w-6 h-6 text-neutral-900" />
            <h1 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
              Live Stock & Inventory Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Real-Time Database Sync
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Dynamic stock tracking across all product variants, sizes (S, M, L, XL, XXL), colors, and SKU codes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setQuickAddItem(null);
              setIsQuickAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Stock / Inbound Restock
          </button>

          <Link
            href="/admin/inventory/movements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 font-bold rounded-xl text-xs border border-neutral-200 transition shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-500" /> Movements & Audit
          </Link>

          <button
            onClick={() => {
              refetchList();
              refetchSummary();
            }}
            className="inline-flex items-center gap-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Action Banner Notice */}
      {bannerNotice && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {bannerNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{bannerNotice.text}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      {!isSummaryLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-neutral-100 rounded-xl">
              <Layers className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                Total SKUs / Variants
              </span>
              <span className="text-xl font-black text-neutral-900 font-mono">
                {summary.totalItems}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                In Stock
              </span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                {summary.inStock}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 font-bold uppercase block">
                Low Stock
              </span>
              <span className="text-xl font-black text-amber-700 font-mono">
                {summary.lowStock}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <span className="text-[10px] text-red-600 font-bold uppercase block">
                Out of Stock
              </span>
              <span className="text-xl font-black text-red-700 font-mono">
                {summary.outOfStock}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Package2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-600 font-bold uppercase block">
                Total Available Units
              </span>
              <span className="text-xl font-black text-neutral-900 font-mono">
                {summary.totalAvailable}{' '}
                <span className="text-xs text-neutral-400 font-normal font-sans">
                  ({summary.totalReserved} rsvd)
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product Name, Variant (S/M/L), Color, SKU..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Status:</span>
          <select
            value={stockStatus}
            onChange={(e) => updateQuery('stockStatus', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">IN STOCK</option>
            <option value="LOW_STOCK">LOW STOCK</option>
            <option value="OUT_OF_STOCK">OUT OF STOCK</option>
            <option value="BACKORDER">BACKORDER</option>
          </select>
        </div>
      </div>

      {/* Inventory Data Table */}
      <DataTable
        columns={columns as Column<InventoryResponse>[]}
        data={filteredInventories}
        total={filteredInventories.length}
        page={page}
        pageSize={15}
        loading={isListLoading}
        error={isError}
        onRetry={() => {
          refetchList();
          refetchSummary();
        }}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('page', String(p));
          router.push(`/admin/inventory?${params}`);
        }}
        rowKey={(i) => i.id}
        emptyMessage="No stock listings found matching the criteria."
      />

      {/* Quick Add Stock Dialog */}
      {isQuickAddOpen && (
        <QuickAddStockDialog
          initialInventory={quickAddItem}
          onClose={() => {
            setIsQuickAddOpen(false);
            setQuickAddItem(null);
          }}
          onSuccess={() => {
            refetchList();
            refetchSummary();
          }}
        />
      )}

      {/* Full Stock Transact / Adjustment Dialog */}
      {actionItem && (
        <StockActionDialog
          inventory={actionItem}
          onClose={() => {
            setActionItem(null);
            refetchList();
            refetchSummary();
          }}
        />
      )}

      {/* Threshold Settings Dialog */}
      {settingsItem && (
        <UpdateInventoryDialog
          inventory={settingsItem}
          onClose={() => {
            setSettingsItem(null);
            refetchList();
            refetchSummary();
          }}
        />
      )}
    </div>
  );
}
