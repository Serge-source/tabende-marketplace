import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', featured: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, name: true, avatar: true, isVerified: true } } },
  });
  return NextResponse.json(listings);
}
