import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { shippingStatus } = await request.json();
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.sellerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updated = await prisma.order.update({ where: { id: params.id }, data: { shippingStatus } });
  return NextResponse.json(updated);
}
