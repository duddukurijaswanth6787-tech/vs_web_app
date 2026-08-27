'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHANNEL_COLORS,
  formatCurrency,
  tickInterval,
  type ChannelFilter,
  type SalesSeriesPoint,
} from './channel';

interface Props {
  series: SalesSeriesPoint[];
  channel: ChannelFilter;
  /** 'revenue' plots money, 'orders' plots counts. */
  measure?: 'revenue' | 'orders';
}

const axisStyle = { fontSize: 11, fill: '#737373' };

/**
 * Online against in-store for each period.
 *
 * Grouped rather than stacked: the question this chart exists to answer is
 * which channel is doing better, and stacked segments make two quantities that
 * share no baseline almost impossible to compare.
 */
export function ChannelTrendChart({ series, channel, measure = 'revenue' }: Props) {
  const money = measure === 'revenue';
  const onlineKey = money ? 'onlineRevenue' : 'onlineOrders';
  const offlineKey = money ? 'offlineRevenue' : 'offlineOrders';
  const format = (v: number) => (money ? formatCurrency(v) : `${v}`);

  const showOnline = channel !== 'POS_SHOPORA';
  const showOffline = channel !== 'ONLINE_STORE';

  if (!series.length) {
    return (
      <div className="h-75 flex items-center justify-center text-sm text-neutral-400">
        No sales recorded in this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={series} margin={{ top: 8, right: 8, left: 4, bottom: 4 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
        <XAxis
          dataKey="label"
          tick={axisStyle}
          interval={tickInterval(series.length)}
          tickLine={false}
          axisLine={{ stroke: '#e5e5e5' }}
        />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={money ? 70 : 40}
          tickFormatter={(v: number) =>
            money ? new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(v) : `${v}`
          }
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          formatter={(value: unknown, name: unknown) => [format(Number(value ?? 0)), String(name ?? '')]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            border: '1px solid #e5e5e5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        {/* Two series always carry a legend, so identity never rests on colour alone. */}
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        {showOnline && (
          <Bar
            dataKey={onlineKey}
            name="Online Store"
            fill={CHANNEL_COLORS.ONLINE_STORE}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        )}
        {showOffline && (
          <Bar
            dataKey={offlineKey}
            name="In-Store (POS)"
            fill={CHANNEL_COLORS.POS_SHOPORA}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
