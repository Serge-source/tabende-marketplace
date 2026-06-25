import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

  const [totalListings, activeListings, totalSales, recentSales, topListings, monthlyRevenue, favorites] = await Promise.all([
    prisma.listing.count({ where: { sellerId: user.id } }),
    prisma.listing.count({ where: { sellerId: user.id, status: 'ACTIVE' } }),
    prisma.order.count({ where: { sellerId: user.id, status: 'PAID' } }),
    prisma.order.findMany({
      where: { sellerId: user.id, status: 'PAID', createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, sellerPayout: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.listing.findMany({
      where: { sellerId: user.id },
      orderBy: { favorites: { _count: 'desc' } },
      take: 5,
      select: { id: true, title: true, price: true, status: true, viewCount: true, _count: { select: { favorites: true, orders: true } } },
    }),
    prisma.order.groupBy({
      by: ['createdAt'],
      where: { sellerId: user.id, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
      _sum: { sellerPayout: true },
    }),
    prisma.favorite.count({ where: { listing: { sellerId: user.id } } }),
  ]);

  const totalRevenue = recentSales.reduce((s, o) => s + (o.sellerPayout || 0), 0);

  // Group sales by day for chart
  const salesByDay = {};
  recentSales.forEach((o) => {
    const day = o.createdAt.toISOString().slice(0, 10);
    salesByDay[day] = (salesByDay[day] || 0) + (o.sellerPayout || 0);
  });

  return NextResponse.json({
    overview: { totalListings, activeListings, totalSales, favorites },
    revenue: { last30Days: Math.round(totalRevenue * 100) / 100, salesByDay },
    topListings,
  });
}
