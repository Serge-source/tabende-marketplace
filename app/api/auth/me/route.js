import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, clearTokenCookie } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, isVerified: true, createdAt: true },
  });
  return NextResponse.json(me);
}

export async function DELETE(request) {
  const res = NextResponse.json({ success: true });
  clearTokenCookie(res);
  return res;
}
