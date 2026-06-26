import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.sellerId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { status: 'ACTIVE', expiresAt, updatedAt: new Date() },
  });

  return NextResponse.json(updated);
}
