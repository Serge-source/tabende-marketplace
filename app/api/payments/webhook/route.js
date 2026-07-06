import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { sendOrderConfirmationEmail, sendSaleNotificationEmail } from '@/lib/email';
import { createNotification } from '@/lib/notify';

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    await prisma.order.updateMany({
      where: { stripeSessionId: session.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    return NextResponse.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { listingId } = session.metadata;

    // Stripe puts the collected address on shipping_details (falls back to
    // billing details if shipping collection was off for this session)
    const ship = session.shipping_details || session.customer_details;
    const shippingAddress = ship?.address
      ? { name: ship.name || session.customer_details?.name || null, ...ship.address }
      : undefined;

    await prisma.order.updateMany({
      where: { stripeSessionId: session.id },
      data: {
        status: 'PAID',
        stripePaymentId: session.payment_intent,
        ...(shippingAddress && { shippingAddress }),
      },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { status: 'SOLD' } });

    // Send emails (non-blocking)
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true } },
      },
    });
    if (order) {
      // Deduct any store credit the buyer applied at checkout
      if (order.creditUsed > 0) {
        await prisma.user.update({
          where: { id: order.buyerId },
          data: { creditBalance: { decrement: order.creditUsed } },
        }).catch(console.error);
      }

      // Referral bonus: referrer earns $5 when their referee completes a first purchase
      const buyerFull = await prisma.user.findUnique({
        where: { id: order.buyerId },
        select: { referredById: true, name: true },
      });
      if (buyerFull?.referredById) {
        const paidOrders = await prisma.order.count({ where: { buyerId: order.buyerId, status: 'PAID' } });
        if (paidOrders === 1) {
          await prisma.user.update({
            where: { id: buyerFull.referredById },
            data: { creditBalance: { increment: 5 } },
          }).catch(console.error);
          createNotification(buyerFull.referredById, {
            type: 'ORDER_UPDATE',
            title: 'Referral bonus earned! 🎉',
            body: `${buyerFull.name} made their first purchase — $5 credit was added to your account.`,
            href: '/dashboard',
          }).catch(console.error);
        }
      }

      sendOrderConfirmationEmail(order).catch(console.error);
      sendSaleNotificationEmail(order).catch(console.error);
      createNotification(order.buyerId, {
        type: 'ORDER_UPDATE',
        title: 'Order confirmed',
        body: `Your purchase of "${order.listing?.title}" is confirmed.`,
        href: '/dashboard',
      }).catch(console.error);
      createNotification(order.sellerId, {
        type: 'ORDER_UPDATE',
        title: 'You made a sale!',
        body: `"${order.listing?.title}" was sold for $${order.amount?.toLocaleString()}.`,
        href: '/dashboard',
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
