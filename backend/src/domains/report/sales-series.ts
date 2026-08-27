/**
 * Buckets orders into a time series split by sales channel, so the admin can
 * compare the shop counter against the website over the same period.
 *
 * Kept out of the service because the awkward parts -- week boundaries, months
 * of unequal length, and periods where one channel sold nothing -- are pure
 * date arithmetic and worth testing without a database.
 */

export type Granularity = 'daily' | 'weekly' | 'monthly';

/** The two channels Order.channel can carry. */
export const ONLINE = 'ONLINE_STORE';
export const OFFLINE = 'POS_SHOPORA';

export interface SeriesOrder {
  createdAt: Date;
  grandTotal: unknown;
  channel?: string | null;
}

export interface SeriesPoint {
  /** Sort/lookup key: '2026-08-27', '2026-W35' or '2026-08'. */
  bucket: string;
  /** Human label for the axis. */
  label: string;
  onlineRevenue: number;
  offlineRevenue: number;
  onlineOrders: number;
  offlineOrders: number;
  totalRevenue: number;
  totalOrders: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Midnight UTC on the given date, so a bucket never straddles two days. */
function startOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/** Monday of the week containing d. Weeks start Monday, as the shop's do. */
function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  // getUTCDay is 0 for Sunday, which belongs to the week that began 6 days ago.
  const shift = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - shift * DAY_MS);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function bucketStart(d: Date, granularity: Granularity): Date {
  if (granularity === 'weekly') return startOfWeek(d);
  if (granularity === 'monthly') return startOfMonth(d);
  return startOfDay(d);
}

/** ISO-8601 week number, used only to label weekly buckets. */
function isoWeek(d: Date): number {
  const thursday = new Date(startOfWeek(d).getTime() + 3 * DAY_MS);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      (thursday.getTime() - startOfWeek(firstThursday).getTime()) /
        (7 * DAY_MS),
    )
  );
}

function keyOf(start: Date, granularity: Granularity): string {
  const y = start.getUTCFullYear();
  if (granularity === 'monthly') {
    return `${y}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  if (granularity === 'weekly') {
    return `${y}-W${String(isoWeek(start)).padStart(2, '0')}`;
  }
  return start.toISOString().slice(0, 10);
}

function labelOf(start: Date, granularity: Granularity): string {
  const month = MONTHS[start.getUTCMonth()];
  if (granularity === 'monthly') return `${month} ${start.getUTCFullYear()}`;
  if (granularity === 'weekly') return `${month} ${start.getUTCDate()}`;
  return `${month} ${start.getUTCDate()}`;
}

/** Advances one bucket. Month arithmetic handles unequal month lengths. */
function next(start: Date, granularity: Granularity): Date {
  if (granularity === 'monthly') {
    return new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );
  }
  return new Date(
    start.getTime() + (granularity === 'weekly' ? 7 : 1) * DAY_MS,
  );
}

/**
 * Builds the series. Buckets with no sales are emitted as zeroes rather than
 * skipped: a line chart that omits a quiet day silently redraws it as busy,
 * because the neighbouring points simply join up.
 */
export function buildSalesSeries(
  orders: SeriesOrder[],
  granularity: Granularity,
  from: Date,
  to: Date,
): SeriesPoint[] {
  const empty = (start: Date): SeriesPoint => ({
    bucket: keyOf(start, granularity),
    label: labelOf(start, granularity),
    onlineRevenue: 0,
    offlineRevenue: 0,
    onlineOrders: 0,
    offlineOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
  });

  const points = new Map<string, SeriesPoint>();
  for (
    let cursor = bucketStart(from, granularity);
    cursor.getTime() <= to.getTime();
    cursor = next(cursor, granularity)
  ) {
    const point = empty(cursor);
    points.set(point.bucket, point);
  }

  for (const order of orders) {
    const start = bucketStart(order.createdAt, granularity);
    const key = keyOf(start, granularity);
    // An order just outside the requested window still gets a bucket, rather
    // than being dropped on the floor without trace.
    const point = points.get(key) ?? empty(start);
    points.set(key, point);

    const amount = Number(order.grandTotal ?? 0);
    const revenue = Number.isFinite(amount) ? amount : 0;
    if (order.channel === OFFLINE) {
      point.offlineRevenue += revenue;
      point.offlineOrders += 1;
    } else {
      // Anything not explicitly POS is the website, matching the column default.
      point.onlineRevenue += revenue;
      point.onlineOrders += 1;
    }
    point.totalRevenue += revenue;
    point.totalOrders += 1;
  }

  return Array.from(points.values()).sort((a, b) =>
    a.bucket.localeCompare(b.bucket),
  );
}

/** Narrows a query string to a granularity, defaulting to daily. */
export function parseGranularity(value?: string): Granularity {
  return value === 'weekly' || value === 'monthly' ? value : 'daily';
}

/** Narrows a query string to a channel filter. Undefined means both. */
export function parseChannel(value?: string): string | undefined {
  return value === ONLINE || value === OFFLINE ? value : undefined;
}
