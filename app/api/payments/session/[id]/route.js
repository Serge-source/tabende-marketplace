import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const session = await stripe.checkout.sessions.retrieve(params.id);
  const order = await prisma.order.findFirst({
    where: { stripeSessionId: params.id },
    include: { listing: { select: { id: true, title: true, images: true } } },
  });
  return NextResponse.json({ session, order });
}
