import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const now = new Date();
  const days30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const days7 = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [users, listings, orders, revenue, newUsers7d, newListings7d, revenueRaw, userGrowthRaw, categoryRaw] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.user.count({ where: { createdAt: { gte: days7 } } }),
    prisma.listing.count({ where: { createdAt: { gte: days7 } } }),
    prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: days30 } },
      select: { amount: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: days30 } },
      select: { createdAt: true },
    }),
    prisma.listing.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
  ]);

  // Build 30-day buckets
  const buckets = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, revenue: 0, users: 0 };
  }
  revenueRaw.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].revenue += o.amount;
  });
  userGrowthRaw.forEach((u) => {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].users += 1;
  });

  return NextResponse.json({
    users,
    listings,
    orders,
    revenue: revenue._sum.amount || 0,
    newUsers7d,
    newListings7d,
    dailyData: Object.values(buckets),
    categories: categoryRaw.map((c) => ({ name: c.category || 'Other', count: c._count.id })),
  });
}
