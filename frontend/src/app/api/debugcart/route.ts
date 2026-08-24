import { NextResponse } from 'next/server';

// Temporary diagnostic route -- delete after use.
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const guestId = '11111111-1111-4111-8111-111111111111';
  const paths = [
    `/cart/summary?guestId=${guestId}`,
    `/cart?guestId=${guestId}`,
  ];
  const results: Record<string, unknown> = {};
  await Promise.all(
    paths.map(async (p) => {
      try {
        const res = await fetch(`${base}${p}`, { cache: 'no-store' });
        const text = await res.text();
        results[p] = { status: res.status, body: text.slice(0, 1500) };
      } catch (e) {
        results[p] = { error: String(e) };
      }
    }),
  );
  return NextResponse.json({ base, results });
}
