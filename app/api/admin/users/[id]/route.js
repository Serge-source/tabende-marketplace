import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const body = await request.json();
  const data = {};
  if (typeof body.isVerified === 'boolean') data.isVerified = body.isVerified;
  if (body.role) data.role = body.role;

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json(user);
}
