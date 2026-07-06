import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET — is this user blocked by me?
export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const block = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: params.id } },
  });
  return NextResponse.json({ blocked: !!block });
}

// POST — block
export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (params.id === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'ADMIN') return NextResponse.json({ error: 'Cannot block platform staff' }, { status: 400 });

  await prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: params.id } },
    create: { blockerId: user.id, blockedId: params.id },
    update: {},
  });
  return NextResponse.json({ blocked: true });
}

// DELETE — unblock
export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  await prisma.blockedUser.deleteMany({
    where: { blockerId: user.id, blockedId: params.id },
  });
  return NextResponse.json({ blocked: false });
}
