'use client';

import React from 'react';
import { useInventoryReport, useInventoryMovementReport } from '@/features/reports';
import {
  AnalyticsControls,
  rangeToDates,
  type DateRange,
} from '@/features/analytics/AnalyticsControls';
import { StockMovementChart } from '@/features/analytics/StockMovementChart';
import type { Granularity, MovementSeriesPoint } from '@/features/analytics/channel';
import { Package, AlertTriangle, XOctagon, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface InventoryReportItem {
  id: string;
  quantity: number;
  reservedQuantity: number;
  stockStatus: string;
  variant?: {
    sku?: string;
    title?: string;
    product?: { name?: string };
  };
}

interface WarehouseBreakdownRow {
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
}

interface InventoryReportData {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  items: InventoryReportItem[];
  warehouseBreakdown?: WarehouseBreakdownRow[];
}

const STOCK_STATUS_COLORS: Record<string, string> = {
  'In Stock': '#059669',
  'Low Stock': '#ca8a04',
  'Out of Stock': '#dc2626',
};

export default function InventoryAnalyticsPage() {
  const [range, setRange] = React.useState<DateRange>('30days');
  const [granularity, setGranularity] = React.useState<Granularity>('daily');

  const { data, isLoading, error, refetch } = useInventoryReport();
  const { startDate, endDate } = rangeToDates(range);
  // The inventory table only holds today's quantity, so the trend comes from
  // the movement ledger instead.
  const movements = useInventoryMovementReport(startDate, endDate, granularity);

  if (isLoading) return <SectionLoader message="Loading inventory reports..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch inventory report." retry={refetch} />;

  const reportData = (data?.data || {
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    items: [],
  }) as InventoryReportData;

  const movementSeries = ((movements.data?.data as { series?: MovementSeriesPoint[] } | undefined)
    ?.series ?? []) as MovementSeriesPoint[];

  const activeStock = reportData.totalItems - reportData.lowStock - reportData.outOfStock;

  const stockStatusChart = [
    { name: 'In Stock', count: activeStock },
    { name: 'Low Stock', count: reportData.lowStock },
    { name: 'Out of Stock', count: reportData.outOfStock },
  ];

  const warehouseBreakdown = reportData.warehouseBreakdown || [];

  const lowStockItems = (reportData.items || []).filter(
    (i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK'
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor warehouse quantities, safety stock levels, and items needing reorder.
          </p>
        </div>
        <AnalyticsControls
          range={range}
          onRangeChange={setRange}
          granularity={granularity}
          onGranularityChange={setGranularity}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900">Stock Movement</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Units received against units sold or written off, grouped {granularity}.
        </p>
        <StockMovementChart
          series={movementSeries}
          loading={movements.isLoading}
          failed={!!movements.error}
        />
      </div>

      {/* KPI Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Items</span>
            <Package className="h-4 w-4 text-neutral-450" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{reportData.totalItems}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Healthy Stock</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mt-3">{activeStock}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600 mt-3">{reportData.lowStock}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Out of Stock</span>
            <XOctagon className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mt-3">{reportData.outOfStock}</h3>
        </div>
      </div>

      {/* Stock Status & Warehouse Distribution Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Stock Status Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockStatusChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} allowDecimals={false} />
                <ChartTooltip
                  formatter={(val: unknown) => [`${val} SKUs`, 'Count']}
                  contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {stockStatusChart.map((entry) => (
                    <Cell key={entry.name} fill={STOCK_STATUS_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Inventory by Warehouse</h3>
          <div className="h-64 w-full">
            {warehouseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="warehouseName" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} allowDecimals={false} />
                  <ChartTooltip
                    formatter={(val: unknown) => [`${val} units`, 'Quantity']}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="totalQuantity" fill="#0369a1" radius={[6, 6, 0, 0]} maxBarSize={80} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400">No per-warehouse stock recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low/Out of Stock Alerts Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Stock Alerts requiring Attention ({lowStockItems.length})</h3>
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Product Style</th>
                  <th className="py-2">SKU ID</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Reserved</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-semibold text-neutral-900">
                      {item.variant?.product?.name || 'Product'} {item.variant?.title && `(${item.variant.title})`}
                    </td>
                    <td className="py-2.5 font-mono text-neutral-500">{item.variant?.sku || 'SKU'}</td>
                    <td className="py-2.5 font-medium">{item.quantity}</td>
                    <td className="py-2.5">{item.reservedQuantity}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${item.stockStatus === 'LOW_STOCK' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                        ${item.stockStatus === 'OUT_OF_STOCK' && 'bg-red-50 text-red-700 border border-red-100'}
                      `}>
                        {item.stockStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/admin/inventory?search=${encodeURIComponent(item.variant?.sku || '')}`}
                        className="text-[11px] font-bold text-neutral-950 hover:underline"
                      >
                        Adjust Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-450">All styles have healthy inventory levels.</p>
          </div>
        )}
      </div>
    </div>
  );
}
