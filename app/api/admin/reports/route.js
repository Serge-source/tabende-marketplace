import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export async function GET(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, status: true } },
        order: { select: { id: true, amount: true, status: true } },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.report.count({ where }),
  ]);

  return NextResponse.json({ items, total, pages: Math.ceil(total / PAGE_SIZE) || 1 });
}
