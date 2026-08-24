import { NextResponse } from 'next/server';

// Temporary diagnostic route -- delete after use.
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const guestId = 'f72b14b4-7261-42c5-883c-dcec3fd47d82';
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
