'use client';

import React from 'react';
import { useDashboardSummary } from '@/features/dashboard';
import { useProductCategoryBreakdown } from '@/features/reports';
import { Package, Award, Sparkles, PieChart as PieChartIcon } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CATEGORY_COLORS = ['#800020', '#c2410c', '#a16207', '#4d7c0f', '#0f766e', '#1d4ed8', '#7e22ce', '#be185d'];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function ProductAnalyticsPage() {
  const { data: summary, isLoading, error, refetch } = useDashboardSummary();
  const { data: categoryData } = useProductCategoryBreakdown();

  if (isLoading) return <SectionLoader message="Loading product catalog performance..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch product catalog details." retry={refetch} />;

  const topProducts = summary?.topProducts || [];

  const topProductsChart = topProducts.slice(0, 10).map((item) => ({
    name: (item.product?.name || 'Unknown').length > 16
      ? `${(item.product?.name || 'Unknown').slice(0, 16)}…`
      : (item.product?.name || 'Unknown'),
    revenue: item._sum.totalPrice || 0,
    units: item._sum.quantity || 0,
  }));

  const categoryBreakdown = (
    (categoryData?.data as { breakdown?: Array<{ categoryId: string; categoryName: string; revenue: number; unitsSold: number }> } | undefined)
      ?.breakdown || []
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Product Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor product demand, top categories, and sales performance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-purple-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Catalog Size</span>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{summary?.totalProducts || 0} Products</h3>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Best Seller Hits</span>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{topProducts.length} Highlighted</h3>
          </div>
        </div>
      </div>

      {/* Top Products & Category Distribution Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Top 10 Best-Selling Products (by Revenue)</h3>
          <div className="h-80 w-full">
            {topProductsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsChart} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
                  <XAxis type="number" stroke="#a3a3a3" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} width={110} />
                  <ChartTooltip
                    formatter={(val: unknown, key) => [key === 'revenue' ? formatCurrency(val as number) : `${val} units`, key === 'revenue' ? 'Revenue' : 'Units Sold']}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="#800020" radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400">No product sales recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-neutral-400" />
            <h3 className="text-base font-bold text-neutral-900">Sales by Category</h3>
          </div>
          <div className="h-80 w-full">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="revenue"
                    nameKey="categoryName"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={(entry: { categoryName?: string; percent?: number }) => `${entry.categoryName} (${((entry.percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.categoryId} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(val: unknown) => formatCurrency(val as number)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400">No categorized sales recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Performance Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-4">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-bold text-neutral-900">Performance Leaderboard</h3>
        </div>
        
        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Product Name</th>
                  <th className="py-2">SKU ID</th>
                  <th className="py-2">Quantity Sold</th>
                  <th className="py-2">Total Value Generated</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {topProducts.map((item, index) => {
                  return (
                    <tr key={item.productId} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-normal w-4">#{index + 1}</span>
                          <span className="truncate max-w-[200px]">{item.product?.name || 'Unknown Product'}</span>
                        </div>
                      </td>
                      <td className="py-3 text-neutral-500 font-mono">
                        {item.productId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 font-medium text-neutral-900">
                        {item._sum.quantity || 0} units
                      </td>
                      <td className="py-3 text-neutral-950 font-semibold">
                        {formatCurrency(item._sum.totalPrice || 0)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/catalog/products?search=${encodeURIComponent(item.product?.name || '')}`}
                          className="text-[11px] font-bold text-neutral-950 hover:underline"
                        >
                          View Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-xs text-neutral-400">No product sales records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
