import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const body = await request.json();
  const data = {};
  if (body.status) data.status = body.status;
  if (typeof body.featured === 'boolean') data.featured = body.featured;

  const listing = await prisma.listing.update({ where: { id: params.id }, data });
  return NextResponse.json(listing);
}
