import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function PUT(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { allowed } = rateLimit({ key: `pwchange:${user.id}`, limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: 'Too many attempts — try again in 15 minutes' }, { status: 429 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'New password must be different from the current one' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.password))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });

  return NextResponse.json({ ok: true });
}
