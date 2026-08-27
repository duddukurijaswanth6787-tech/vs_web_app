'use client';

import React, { useState } from 'react';
import { useSalesReport } from '@/features/reports';
import { OrderResponse } from '@/features/orders/order.types';
import {
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  Store,
  Globe,
} from 'lucide-react';
import {
  AnalyticsControls,
  rangeToDates,
  type DateRange,
} from '@/features/analytics/AnalyticsControls';
import { ChannelTrendChart } from '@/features/analytics/ChannelTrendChart';
import {
  CHANNEL_COLORS,
  formatCurrency,
  type ChannelFilter,
  type Granularity,
  type SalesSeriesPoint,
} from '@/features/analytics/channel';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  orders: OrderResponse[];
  series?: SalesSeriesPoint[];
  onlineRevenue?: number;
  offlineRevenue?: number;
  onlineOrders?: number;
  offlineOrders?: number;
}

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [channel, setChannel] = useState<ChannelFilter>('ALL');

  const { startDate, endDate } = rangeToDates(dateRange);
  const { data, isLoading, error, refetch } = useSalesReport(
    startDate,
    endDate,
    granularity,
    channel,
  );

  if (isLoading) return <SectionLoader message="Loading sales analytics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch sales report." retry={refetch} />;

  const reportData = (data?.data || {
    totalRevenue: 0,
    totalOrders: 0,
    orders: [],
  }) as SalesReportData;

  // The server buckets and splits the series, so the browser no longer has to
  // hold every order in the range to draw a chart.
  const series = reportData.series ?? [];

  const avgOrderValue = reportData.totalOrders > 0
    ? reportData.totalRevenue / reportData.totalOrders
    : 0;

  const onlineRevenue = reportData.onlineRevenue ?? 0;
  const offlineRevenue = reportData.offlineRevenue ?? 0;

  const kpis = [
    { title: 'Gross Revenue', value: formatCurrency(reportData.totalRevenue), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { title: 'Total Orders', value: `${reportData.totalOrders} Orders`, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { title: 'Average Order Value', value: formatCurrency(avgOrderValue), icon: ArrowUpRight, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  ];

  const channelCards = [
    {
      label: 'Online Store',
      icon: Globe,
      revenue: onlineRevenue,
      orders: reportData.onlineOrders ?? 0,
      color: CHANNEL_COLORS.ONLINE_STORE,
    },
    {
      label: 'In-Store (POS)',
      icon: Store,
      revenue: offlineRevenue,
      orders: reportData.offlineOrders ?? 0,
      color: CHANNEL_COLORS.POS_SHOPORA,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sales Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track business growth, orders, and average ticket size.
          </p>
        </div>
        <AnalyticsControls
          range={dateRange}
          onRangeChange={setDateRange}
          granularity={granularity}
          onGranularityChange={setGranularity}
          channel={channel}
          onChannelChange={setChannel}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{kpi.title}</span>
                <div className={`rounded-lg border p-1.5 ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-4">{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Per-channel totals. Labelled and iconed, so the two are told apart
          without relying on the colour of the dot beside them. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {channelCards.map((c) => {
          const Icon = c.icon;
          const share = reportData.totalRevenue > 0
            ? Math.round((c.revenue / reportData.totalRevenue) * 100)
            : 0;
          return (
            <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                  aria-hidden="true"
                />
                <Icon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {c.label}
                </span>
                <span className="ml-auto text-xs text-neutral-400">{share}% of revenue</span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-3">
                {formatCurrency(c.revenue)}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">{c.orders} orders</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900">Revenue by Channel</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Online store against the shop counter, grouped {granularity}.
        </p>
        <ChannelTrendChart series={series} channel={channel} measure="revenue" />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900">Order Count by Channel</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          How many sales each channel made, rather than how much they were worth.
        </p>
        <ChannelTrendChart series={series} channel={channel} measure="orders" />
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Orders Audited ({reportData.totalOrders})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-2">Order No</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-700">
              {reportData.orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 font-medium text-neutral-900">{o.orderNumber}</td>
                  <td className="py-2.5">{formatCurrency(o.grandTotal)}</td>
                  <td className="py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${o.status === 'DELIVERED' && 'bg-green-50 text-green-700 border border-green-100'}
                      ${o.status === 'PENDING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                      ${o.status === 'CANCELLED' && 'bg-red-50 text-red-700 border border-red-100'}
                      ${!['DELIVERED', 'PENDING', 'CANCELLED'].includes(o.status) && 'bg-neutral-50 text-neutral-700 border border-neutral-100'}
                    `}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-neutral-450">
                    {new Date(o.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
