import {
  buildSalesSeries,
  parseChannel,
  parseGranularity,
  OFFLINE,
  ONLINE,
} from './sales-series';

/**
 * These numbers are read as business performance, so a bucket that lands in the
 * wrong week or a quiet day that silently disappears is not a cosmetic bug --
 * it changes what the shop believes it earned.
 */

const order = (iso: string, total: number, channel?: string) => ({
  createdAt: new Date(iso),
  grandTotal: total,
  channel,
});

const from = new Date('2026-08-01T00:00:00Z');
const to = new Date('2026-08-31T23:59:59Z');

describe('buildSalesSeries', () => {
  it('keeps the counter and the website apart', () => {
    const series = buildSalesSeries(
      [
        order('2026-08-10T09:00:00Z', 1000, ONLINE),
        order('2026-08-10T18:00:00Z', 250, OFFLINE),
      ],
      'daily',
      from,
      to,
    );
    const day = series.find((p) => p.bucket === '2026-08-10')!;

    expect(day.onlineRevenue).toBe(1000);
    expect(day.offlineRevenue).toBe(250);
    expect(day.totalRevenue).toBe(1250);
    expect(day.onlineOrders).toBe(1);
    expect(day.offlineOrders).toBe(1);
  });

  it('counts an order with no channel as online, matching the column default', () => {
    const series = buildSalesSeries(
      [order('2026-08-10T09:00:00Z', 500)],
      'daily',
      from,
      to,
    );
    const day = series.find((p) => p.bucket === '2026-08-10')!;

    expect(day.onlineRevenue).toBe(500);
    expect(day.offlineRevenue).toBe(0);
  });

  it('emits quiet days as zero instead of dropping them', () => {
    // A missing point does not read as "nothing sold": the line just joins the
    // neighbours and draws straight through a day the shop was shut.
    const series = buildSalesSeries(
      [order('2026-08-10T09:00:00Z', 100, ONLINE)],
      'daily',
      from,
      to,
    );

    expect(series).toHaveLength(31);
    expect(series[0]).toMatchObject({
      bucket: '2026-08-01',
      totalRevenue: 0,
      totalOrders: 0,
    });
    expect(series.at(-1)!.bucket).toBe('2026-08-31');
  });

  it('returns buckets in chronological order', () => {
    const series = buildSalesSeries(
      [
        order('2026-08-20T09:00:00Z', 1, ONLINE),
        order('2026-08-02T09:00:00Z', 1, ONLINE),
      ],
      'daily',
      from,
      to,
    );
    const keys = series.map((p) => p.bucket);

    expect([...keys].sort()).toEqual(keys);
  });

  it('groups a week from Monday to Sunday', () => {
    // 2026-08-10 is a Monday; the 16th is the Sunday that closes that week.
    const series = buildSalesSeries(
      [
        order('2026-08-10T09:00:00Z', 100, ONLINE),
        order('2026-08-16T23:00:00Z', 50, OFFLINE),
        order('2026-08-17T00:30:00Z', 999, ONLINE),
      ],
      'weekly',
      from,
      to,
    );

    const week = series.find((p) => p.totalRevenue === 150);
    expect(week).toBeDefined();
    expect(week!.onlineRevenue).toBe(100);
    expect(week!.offlineRevenue).toBe(50);
    // The Monday order belongs to the following week, not this one.
    expect(series.some((p) => p.totalRevenue === 999)).toBe(true);
  });

  it('groups by calendar month across months of different lengths', () => {
    const series = buildSalesSeries(
      [
        order('2026-01-31T09:00:00Z', 10, ONLINE),
        order('2026-02-01T09:00:00Z', 20, ONLINE),
        order('2026-02-28T09:00:00Z', 30, OFFLINE),
      ],
      'monthly',
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-03-31T00:00:00Z'),
    );

    expect(series.map((p) => p.bucket)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
    expect(series[0].totalRevenue).toBe(10);
    expect(series[1].totalRevenue).toBe(50);
    expect(series[2].totalRevenue).toBe(0);
  });

  it('treats a null total as zero rather than NaN', () => {
    // One NaN poisons every sum downstream and renders the chart blank.
    const series = buildSalesSeries(
      [
        {
          createdAt: new Date('2026-08-10T09:00:00Z'),
          grandTotal: null,
          channel: ONLINE,
        },
      ],
      'daily',
      from,
      to,
    );

    expect(series.find((p) => p.bucket === '2026-08-10')!.totalRevenue).toBe(0);
    expect(series.every((p) => Number.isFinite(p.totalRevenue))).toBe(true);
  });

  it('accepts the Decimal-like values Prisma returns', () => {
    const series = buildSalesSeries(
      [
        {
          createdAt: new Date('2026-08-10T09:00:00Z'),
          grandTotal: '1250.50',
          channel: OFFLINE,
        },
      ],
      'daily',
      from,
      to,
    );

    expect(series.find((p) => p.bucket === '2026-08-10')!.offlineRevenue).toBe(
      1250.5,
    );
  });

  it('still reports an order that falls outside the requested window', () => {
    const series = buildSalesSeries(
      [order('2026-09-05T09:00:00Z', 77, ONLINE)],
      'daily',
      from,
      to,
    );

    expect(series.find((p) => p.bucket === '2026-09-05')?.totalRevenue).toBe(
      77,
    );
  });
});

describe('query parsing', () => {
  it.each([
    ['daily', 'daily'],
    ['weekly', 'weekly'],
    ['monthly', 'monthly'],
    ['hourly', 'daily'],
    [undefined, 'daily'],
    ['', 'daily'],
  ])('reads granularity %s as %s', (input, expected) => {
    expect(parseGranularity(input as string)).toBe(expected);
  });

  it('ignores a channel it does not recognise instead of returning nothing', () => {
    expect(parseChannel('DROP TABLE orders')).toBeUndefined();
    expect(parseChannel(ONLINE)).toBe(ONLINE);
    expect(parseChannel(OFFLINE)).toBe(OFFLINE);
  });
});
