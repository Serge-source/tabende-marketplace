import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, avatar: true, bio: true, isVerified: true, role: true, createdAt: true, mfaEnabled: true,
      listings: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 20 },
      reviewsReceived: {
        include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { listings: true, sales: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}
