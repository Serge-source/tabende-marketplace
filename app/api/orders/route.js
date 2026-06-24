import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: {
      listing: { select: { id: true, title: true, images: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
}
