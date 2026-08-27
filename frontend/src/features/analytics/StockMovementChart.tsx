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
import { MOVEMENT_COLORS, tickInterval, type MovementSeriesPoint } from './channel';

interface Props {
  series: MovementSeriesPoint[];
  loading?: boolean;
  failed?: boolean;
}

const axisStyle = { fontSize: 11, fill: '#737373' };

/**
 * Units in against units out per period.
 *
 * Grouped rather than stacked, and never netted into a single bar: a period
 * that took in 100 and sold 100 is not the same as one where nothing moved,
 * and a net-only chart draws them identically.
 */
export function StockMovementChart({ series, loading, failed }: Props) {
  if (loading) {
    return (
      <div className="h-75 flex items-center justify-center text-sm text-neutral-400">
        Loading stock movement…
      </div>
    );
  }
  if (failed) {
    return (
      <div className="h-75 flex items-center justify-center text-sm text-red-600">
        Could not load stock movement.
      </div>
    );
  }
  if (!series.length) {
    return (
      <div className="h-75 flex items-center justify-center text-sm text-neutral-400">
        No stock movement recorded in this period
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
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          formatter={(value: unknown, name: unknown) => [`${Number(value ?? 0)} units`, String(name ?? '')]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            border: '1px solid #e5e5e5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar dataKey="stockIn" name="Stock In" fill={MOVEMENT_COLORS.in} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="stockOut" name="Stock Out" fill={MOVEMENT_COLORS.out} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
