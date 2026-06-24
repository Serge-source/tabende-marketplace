import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { listing: { include: { seller: { select: { id: true, name: true, avatar: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(favs.map((f) => f.listing));
}
