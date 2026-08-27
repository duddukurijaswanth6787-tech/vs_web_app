'use client';

import React from 'react';
import { Calendar, Filter, BarChart3 } from 'lucide-react';
import {
  CHANNEL_FILTERS,
  GRANULARITIES,
  type ChannelFilter,
  type Granularity,
} from './channel';

export type DateRange = '7days' | '30days' | '90days' | '12months';

const RANGES: { value: DateRange; label: string }[] = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: '12months', label: 'Last 12 Months' },
];

/** Turns the chosen range into the ISO dates the report endpoints expect. */
export function rangeToDates(range: DateRange): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now);
  if (range === '7days') start.setDate(now.getDate() - 7);
  else if (range === '90days') start.setDate(now.getDate() - 90);
  else if (range === '12months') start.setFullYear(now.getFullYear() - 1);
  else start.setDate(now.getDate() - 30);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

/**
 * A year of daily buckets is 365 unreadable bars, and a week of monthly ones is
 * a single column. Neither is wrong data, but neither answers anything, so the
 * sensible pairing is suggested when the range changes.
 */
export function defaultGranularityFor(range: DateRange): Granularity {
  if (range === '12months') return 'monthly';
  if (range === '90days') return 'weekly';
  return 'daily';
}

const selectClass =
  'text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 min-w-0';

interface Props {
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  /** Omitted on pages that have no channel dimension. */
  channel?: ChannelFilter;
  onChannelChange?: (c: ChannelFilter) => void;
}

export function AnalyticsControls({
  range,
  onRangeChange,
  granularity,
  onGranularityChange,
  channel,
  onChannelChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden="true" />
        <select
          value={range}
          aria-label="Date range"
          onChange={(e) => {
            const next = e.target.value as DateRange;
            onRangeChange(next);
            onGranularityChange(defaultGranularityFor(next));
          }}
          className={selectClass}
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden="true" />
        <select
          value={granularity}
          aria-label="Group by"
          onChange={(e) => onGranularityChange(e.target.value as Granularity)}
          className={selectClass}
        >
          {GRANULARITIES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {channel !== undefined && onChannelChange && (
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden="true" />
          <select
            value={channel}
            aria-label="Sales channel"
            onChange={(e) => onChannelChange(e.target.value as ChannelFilter)}
            className={selectClass}
          >
            {CHANNEL_FILTERS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
