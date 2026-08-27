'use client';

import React, { useState } from 'react';
import { useOrderReport } from '@/features/reports';
import { OrderResponse } from '@/features/orders/order.types';
import { ShoppingCart, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import {
  AnalyticsControls,
  rangeToDates,
  type DateRange,
} from '@/features/analytics/AnalyticsControls';
import {
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  formatCurrency,
  type ChannelFilter,
  type Granularity,
} from '@/features/analytics/channel';

interface ChannelBreakdownRow {
  channel: string;
  orders: number;
  revenue: number;
}

interface OrderReportData {
  totalOrders: number;
  statusBreakdown: Record<string, number>;
  channelBreakdown?: ChannelBreakdownRow[];
  orders: OrderResponse[];
}

const formatAge = (createdAt: string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default function OrderAnalyticsPage() {
  const [range, setRange] = useState<DateRange>('30days');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [channel, setChannel] = useState<ChannelFilter>('ALL');

  const { startDate, endDate } = rangeToDates(range);
  const { data, isLoading, error, refetch } = useOrderReport(startDate, endDate, channel);

  if (isLoading) return <SectionLoader message="Loading order metrics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch order report." retry={refetch} />;

  const reportData = (data?.data || {
    totalOrders: 0,
    statusBreakdown: {},
    orders: [],
  }) as OrderReportData;

  const channelRows = (reportData.channelBreakdown ?? []).map((row) => ({
    ...row,
    label: CHANNEL_LABELS[row.channel] ?? row.channel,
    color: CHANNEL_COLORS[row.channel as keyof typeof CHANNEL_COLORS] ?? '#a3a3a3',
  }));

  // Breakdowns
  const breakdown = reportData.statusBreakdown || {};
  const dataBar = Object.entries(breakdown).map(([name, val]) => ({
    name,
    Count: val,
  }));

  // Awaiting actions (e.g. pending or processing)
  const pendingOrders = (reportData.orders || []).filter((o) => o.status === 'PENDING');
  const processingOrders = (reportData.orders || []).filter((o) => o.status === 'PROCESSING');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Order Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Analyze order pipelines, status transitions, and lifecycle bottlenecks.
          </p>
        </div>
        <AnalyticsControls
          range={range}
          onRangeChange={setRange}
          granularity={granularity}
          onGranularityChange={setGranularity}
          channel={channel}
          onChannelChange={setChannel}
        />
      </div>

      {channelRows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {channelRows.map((row) => (
            <div key={row.channel} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: row.color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {row.label}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-3">{row.orders} orders</h3>
              <p className="text-xs text-neutral-500 mt-1">{formatCurrency(row.revenue)} revenue</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Volume</span>
            <ShoppingCart className="h-4 w-4 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{reportData.totalOrders}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Delivered</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mt-3">{breakdown.DELIVERED || 0}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Pending Review</span>
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600 mt-3">{breakdown.PENDING || 0}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Cancelled</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mt-3">{breakdown.CANCELLED || 0}</h3>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Pipeline Status Distribution</h3>
          <div className="h-64 w-full flex-1">
            {dataBar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataBar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#fafafa' }} />
                  <Bar dataKey="Count" fill="#171717" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-neutral-400">No data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Required Board */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Awaiting Action</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-64 pr-1">
            <div className="border-b pb-3">
              <span className="text-xs text-neutral-400 font-semibold uppercase">Pending Confirmation ({pendingOrders.length})</span>
              <div className="space-y-2 mt-2">
                {pendingOrders.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-800">{o.orderNumber}</span>
                    <span className="text-neutral-400">{formatAge(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-400 font-semibold uppercase">In Processing ({processingOrders.length})</span>
              <div className="space-y-2 mt-2">
                {processingOrders.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-800">{o.orderNumber}</span>
                    <span className="text-neutral-400">{formatAge(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
