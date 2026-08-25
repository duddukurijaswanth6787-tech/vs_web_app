import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const res = await fetch('https://api.vasanthissignature.in/health', {
      cache: 'no-store',
    });
    results.apiVasanthissignatureIn = {
      ok: res.ok,
      status: res.status,
      body: await res.text(),
    };
  } catch (err) {
    results.apiVasanthissignatureIn = { error: String(err) };
  }

  try {
    const res = await fetch('https://vsss-production.up.railway.app/health', {
      cache: 'no-store',
    });
    results.railwayDirect = {
      ok: res.ok,
      status: res.status,
      body: await res.text(),
    };
  } catch (err) {
    results.railwayDirect = { error: String(err) };
  }

  return NextResponse.json(results);
}
