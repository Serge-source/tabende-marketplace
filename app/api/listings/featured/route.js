import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Auto-expire paid boosts
  await prisma.listing.updateMany({
    where: { isBoosted: true, boostExpiresAt: { lt: new Date() } },
    data: { isBoosted: false, featured: false },
  });

  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', featured: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, name: true, avatar: true, isVerified: true } } },
  });
  return NextResponse.json(listings);
}
