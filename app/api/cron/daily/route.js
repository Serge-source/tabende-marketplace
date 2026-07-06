import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Daily maintenance. Trigger with:
//   curl -X POST $APP_URL/api/cron/daily -H "Authorization: Bearer $CRON_SECRET"
// Schedule via Railway cron, GitHub Actions schedule, or any external pinger.
export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = {};

  // 1. Expire finished boosts
  const expiredBoosts = await prisma.listing.updateMany({
    where: { isBoosted: true, boostExpiresAt: { lt: now } },
    data: { isBoosted: false, featured: false, boostExpiresAt: null },
  });
  results.boostsExpired = expiredBoosts.count;

  // 2. Cancel PENDING orders older than 24h (checkout sessions max out at 24h,
  //    so these can never complete; the expired-session webhook is the primary
  //    path and this is the safety net)
  const staleCutoff = new Date(now - 24 * 60 * 60 * 1000);
  const staleOrders = await prisma.order.updateMany({
    where: { status: 'PENDING', createdAt: { lt: staleCutoff } },
    data: { status: 'CANCELLED' },
  });
  results.staleOrdersCancelled = staleOrders.count;

  // 3. Expire pending offers past their 48h window
  const expiredOffers = await prisma.offer.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    data: { status: 'EXPIRED' },
  });
  results.offersExpired = expiredOffers.count;

  // 4. Warn sellers about listings expiring within 7 days (once per listing)
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiring = await prisma.listing.findMany({
    where: { status: 'ACTIVE', expiresAt: { gt: now, lt: soon } },
    select: { id: true, title: true, sellerId: true, expiresAt: true },
  });

  let warned = 0;
  for (const l of expiring) {
    const already = await prisma.notification.findFirst({
      where: { userId: l.sellerId, type: 'LISTING_EXPIRING', href: `/dashboard?expiring=${l.id}` },
    });
    if (already) continue;
    const daysLeft = Math.ceil((l.expiresAt - now) / (1000 * 60 * 60 * 24));
    await createNotification(l.sellerId, {
      type: 'LISTING_EXPIRING',
      title: 'Listing expiring soon',
      body: `"${l.title}" expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Relist it from your dashboard to keep it active.`,
      href: `/dashboard?expiring=${l.id}`,
    });
    warned += 1;
  }
  results.expiryWarningsSent = warned;

  // 5. Saved-search alerts: notify users about new matching listings
  const savedSearches = await prisma.savedSearch.findMany();
  let searchAlerts = 0;
  for (const s of savedSearches) {
    const where = {
      status: 'ACTIVE',
      createdAt: { gt: s.lastNotifiedAt },
      ...(s.query && {
        OR: [
          { title: { contains: s.query, mode: 'insensitive' } },
          { description: { contains: s.query, mode: 'insensitive' } },
        ],
      }),
      ...(s.category && { category: s.category }),
      ...(s.location && { location: { contains: s.location, mode: 'insensitive' } }),
      ...(s.minPrice != null && { price: { gte: s.minPrice } }),
      ...(s.maxPrice != null && { price: { ...(s.minPrice != null ? { gte: s.minPrice } : {}), lte: s.maxPrice } }),
    };
    const matches = await prisma.listing.count({ where });
    if (matches === 0) continue;

    const params = new URLSearchParams();
    if (s.query) params.set('search', s.query);
    if (s.category) params.set('category', s.category);
    if (s.location) params.set('location', s.location);
    const label = [s.query, s.category, s.location].filter(Boolean).join(' · ');

    await createNotification(s.userId, {
      type: 'SAVED_SEARCH',
      title: `${matches} new listing${matches === 1 ? '' : 's'} for "${label}"`,
      body: 'New items matching your saved search were posted. Take a look before they sell.',
      href: `/browse?${params.toString()}`,
    });
    await prisma.savedSearch.update({ where: { id: s.id }, data: { lastNotifiedAt: now } });
    searchAlerts += 1;
  }
  results.savedSearchAlerts = searchAlerts;

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), ...results });
}
