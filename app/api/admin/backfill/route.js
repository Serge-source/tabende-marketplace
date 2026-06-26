import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// One-time backfill: set expiresAt on listings that don't have one
export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.listing.updateMany({
    where: { expiresAt: null, status: { in: ['ACTIVE', 'DRAFT'] } },
    data: { expiresAt },
  });

  return NextResponse.json({ updated: count, expiresAt });
}
