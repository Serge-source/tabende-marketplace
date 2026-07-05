import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notify';

// POST /api/orders/[id]/cancel
// - Buyer: cancel a PENDING (unpaid) order
// - Seller: cancel a PAID order that hasn't shipped → full Stripe refund + relist
export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { listing: { select: { id: true, title: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const isBuyer = order.buyerId === user.id;
  const isSeller = order.sellerId === user.id;
  if (!isBuyer && !isSeller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Unpaid order — either party can cancel, nothing to refund
  if (order.status === 'PENDING') {
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    return NextResponse.json(updated);
  }

  // Paid order — only the seller can cancel, and only before it ships
  if (order.status === 'PAID') {
    if (!isSeller) {
      return NextResponse.json(
        { error: 'Paid orders can only be cancelled by the seller. If there is a problem with your order, open a dispute instead.' },
        { status: 403 }
      );
    }
    if (order.shippingStatus !== 'ORDER_PLACED') {
      return NextResponse.json({ error: 'Cannot cancel after the item has shipped' }, { status: 400 });
    }
    if (!order.stripePaymentId) {
      return NextResponse.json({ error: 'No payment reference found for this order' }, { status: 400 });
    }

    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentId });
    } catch (err) {
      console.error('[cancel] refund failed:', err.message);
      return NextResponse.json({ error: `Refund failed: ${err.message}` }, { status: 502 });
    }

    const [updated] = await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } }),
      prisma.listing.update({
        where: { id: order.listingId },
        data: { status: 'ACTIVE', expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    createNotification(order.buyerId, {
      type: 'ORDER_UPDATE',
      title: 'Order cancelled & refunded',
      body: `The seller cancelled your order for "${order.listing.title}". Your $${order.amount.toLocaleString()} refund is on its way (5–10 business days).`,
      href: '/dashboard',
    }).catch(console.error);

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: `Cannot cancel an order that is ${order.status.toLowerCase()}` }, { status: 400 });
}
