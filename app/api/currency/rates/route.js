import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fallbacks: USD is officially pegged at 1.79 AWG; EUR approximation
const FALLBACK = { USD: 1 / 1.79, EUR: 1 / 1.95 };
const TTL_MS = 12 * 60 * 60 * 1000; // refresh twice a day

let cache = { rates: FALLBACK, fetchedAt: 0, source: 'fallback' };

export async function GET() {
  if (Date.now() - cache.fetchedAt < TTL_MS) {
    return NextResponse.json({ base: 'AWG', source: cache.source, ...cache.rates });
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/AWG', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const usd = data?.rates?.USD;
      const eur = data?.rates?.EUR;
      // Sanity-validate against the official peg: live USD must sit near
      // 1/1.79; if the feed is off by >5% something is wrong — keep fallback
      if (usd && eur && Math.abs(usd - FALLBACK.USD) / FALLBACK.USD < 0.05) {
        cache = { rates: { USD: usd, EUR: eur }, fetchedAt: Date.now(), source: 'live' };
      }
    }
  } catch (err) {
    console.error('[currency] rate fetch failed:', err.message);
  }

  if (cache.source !== 'live') cache.fetchedAt = Date.now(); // don't hammer a failing feed
  return NextResponse.json({ base: 'AWG', source: cache.source, ...cache.rates });
}
