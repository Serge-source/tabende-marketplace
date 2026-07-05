import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notify';

// POST /api/admin/orders/[id]/refund — admin issues a full refund
// Body: { relist?: boolean, resolveReportId?: string }
export async function POST(request, { params }) {
  const { user, error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const { relist = false, resolveReportId } = await request.json().catch(() => ({}));

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { listing: { select: { id: true, title: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'PAID') {
    return NextResponse.json({ error: `Order is ${order.status.toLowerCase()}, not refundable` }, { status: 400 });
  }
  if (!order.stripePaymentId) {
    return NextResponse.json({ error: 'No payment reference on this order' }, { status: 400 });
  }

  try {
    await stripe.refunds.create({ payment_intent: order.stripePaymentId });
  } catch (err) {
    console.error('[admin refund]', err.message);
    return NextResponse.json({ error: `Stripe refund failed: ${err.message}` }, { status: 502 });
  }

  const ops = [
    prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } }),
  ];
  if (relist) {
    ops.push(prisma.listing.update({
      where: { id: order.listingId },
      data: { status: 'ACTIVE', expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
    }));
  }
  if (resolveReportId) {
    ops.push(prisma.report.update({
      where: { id: resolveReportId },
      data: { status: 'RESOLVED', adminNote: `Refunded by ${user.name} on ${new Date().toISOString()}` },
    }));
  }
  await prisma.$transaction(ops);

  createNotification(order.buyerId, {
    type: 'ORDER_UPDATE',
    title: 'Refund issued',
    body: `Your $${order.amount.toLocaleString()} payment for "${order.listing.title}" has been refunded (5–10 business days).`,
    href: '/dashboard',
  }).catch(console.error);
  createNotification(order.sellerId, {
    type: 'ORDER_UPDATE',
    title: 'Order refunded',
    body: `The order for "${order.listing.title}" was refunded to the buyer after review.`,
    href: '/dashboard',
  }).catch(console.error);

  return NextResponse.json({ ok: true, orderId: order.id, status: 'REFUNDED' });
}
