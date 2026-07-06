import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, clearTokenCookie, signToken, setTokenCookie } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, isVerified: true, createdAt: true, language: true },
  });
  if (!me) {
    const gone = NextResponse.json({ error: 'Account not found' }, { status: 401 });
    clearTokenCookie(gone);
    return gone;
  }

  const res = NextResponse.json(me);
  // Sliding session: re-issue when claims went stale (role/name changed)
  // or the token is over an hour old, so active users never hit the 24h
  // expiry while inactive sessions lapse within a day
  const tokenAgeSec = user.iat ? Math.floor(Date.now() / 1000) - user.iat : Infinity;
  if (me.role !== user.role || me.name !== user.name || tokenAgeSec > 3600) {
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
