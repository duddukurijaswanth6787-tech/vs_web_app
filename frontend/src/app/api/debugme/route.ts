import { NextResponse } from 'next/server';

// Temporary diagnostic route -- delete after use.
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const guestId = 'a0235e71-5bc6-4e6c-840f-026f93e18634';
  const paths = [
    `/wishlist/items?page=1&limit=50`,
    `/cart?guestId=${guestId}`,
    `/me`,
    `/me/addresses`,
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
