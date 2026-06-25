import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, bio, role, avatar } = body;

    const data = {};
    if (name) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (role && ['BUYER', 'SELLER'].includes(role)) data.role = role;
    // avatar arrives as a base64 data URL from the client
    if (avatar && typeof avatar === 'string' && avatar.length > 10) data.avatar = avatar;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, isVerified: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[users/me PUT] error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
