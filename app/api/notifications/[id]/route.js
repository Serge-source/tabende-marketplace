import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  await prisma.notification.updateMany({
    where: { id: params.id, userId: user.id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
