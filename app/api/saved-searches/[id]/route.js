import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const search = await prisma.savedSearch.findUnique({ where: { id: params.id } });
  if (!search) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (search.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.savedSearch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
