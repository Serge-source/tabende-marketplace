import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, clearTokenCookie, signToken, setTokenCookie } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, isVerified: true, createdAt: true },
  });
  if (!me) {
    const gone = NextResponse.json({ error: 'Account not found' }, { status: 401 });
    clearTokenCookie(gone);
    return gone;
  }

  const res = NextResponse.json(me);
  // Token claims (role/name) can go stale after an admin change — re-issue
  // the cookie so middleware and API guards see the current values
  if (me.role !== user.role || me.name !== user.name) {
    const fresh = await signToken({ id: me.id, email: me.email, role: me.role, name: me.name });
    setTokenCookie(res, fresh);
  }
  return res;
}

export async function DELETE(request) {
  const res = NextResponse.json({ success: true });
  clearTokenCookie(res);
  return res;
}
