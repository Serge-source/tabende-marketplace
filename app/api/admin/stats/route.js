import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const [users, listings, orders, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
  ]);
  return NextResponse.json({ users, listings, orders, revenue: revenue._sum.amount || 0 });
}
