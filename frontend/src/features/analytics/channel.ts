/**
 * Shared vocabulary for the channel-vs-channel analytics: the shop counter
 * (POS) against the website, over a chosen period.
 */

export type Granularity = 'daily' | 'weekly' | 'monthly';
export type ChannelFilter = 'ALL' | 'ONLINE_STORE' | 'POS_SHOPORA';

export const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const CHANNEL_FILTERS: { value: ChannelFilter; label: string }[] = [
  { value: 'ALL', label: 'All Channels' },
  { value: 'ONLINE_STORE', label: 'Online Store' },
  { value: 'POS_SHOPORA', label: 'In-Store (POS)' },
];

export const CHANNEL_LABELS: Record<string, string> = {
  ONLINE_STORE: 'Online Store',
  POS_SHOPORA: 'In-Store (POS)',
};

/**
 * Two categorical hues carrying series identity.
 *
 * Validated as a pair rather than picked by eye -- both modes pass the
 * lightness band, chroma floor, CVD separation (worst adjacent ΔE 24.7 protan)
 * and 3:1 contrast against the chart surface. The previous in-store/online pair
 * used #171717, which has zero chroma: it reads as plain gray rather than as a
 * series, and sits outside the lightness band entirely.
 */
export const CHANNEL_COLORS = {
  ONLINE_STORE: 'var(--viz-series-1, #2a78d6)',
  POS_SHOPORA: 'var(--viz-series-2, #eb6834)',
} as const;

/** Stock movement direction reuses the same validated pair. */
export const MOVEMENT_COLORS = {
  in: 'var(--viz-series-1, #2a78d6)',
  out: 'var(--viz-series-2, #eb6834)',
} as const;

export interface SalesSeriesPoint {
  bucket: string;
  label: string;
  onlineRevenue: number;
  offlineRevenue: number;
  onlineOrders: number;
  offlineOrders: number;
  totalRevenue: number;
  totalOrders: number;
}

export interface MovementSeriesPoint {
  bucket: string;
  label: string;
  stockIn: number;
  stockOut: number;
  movementsIn: number;
  movementsOut: number;
  net: number;
}

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

/**
 * Thins axis ticks so labels never collide.
 *
 * Ninety daily buckets cannot each carry a readable label; showing every nth
 * keeps the axis legible without dropping the underlying data points.
 */
export function tickInterval(count: number): number {
  if (count <= 12) return 0;
  return Math.ceil(count / 12) - 1;
}
