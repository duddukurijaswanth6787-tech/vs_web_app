import { NextResponse } from 'next/server';

// Temporary diagnostic route -- calls the live backend server-side (no CORS,
// no browser cache) to see exactly what the public storefront endpoints
// return right now. Delete after use.
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const paths = ['/categories/featured', '/categories?isVisible=true&limit=20', '/cms/banners', '/homepage'];

  const results: Record<string, unknown> = {};
  await Promise.all(
    paths.map(async (p) => {
      try {
        const res = await fetch(`${base}${p}`, { cache: 'no-store' });
        const text = await res.text();
        results[p] = { status: res.status, body: text.slice(0, 2000) };
      } catch (e) {
        results[p] = { error: String(e) };
      }
    }),
  );

  return NextResponse.json({ base, results });
}
