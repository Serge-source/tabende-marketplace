import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, isVerified: true, createdAt: true,
      _count: { select: { listings: true, orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(users);
}
