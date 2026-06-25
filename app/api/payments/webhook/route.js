import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { sendOrderConfirmationEmail, sendSaleNotificationEmail } from '@/lib/email';

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { listingId } = session.metadata;

    await prisma.order.updateMany({
      where: { stripeSessionId: session.id },
      data: { status: 'PAID', stripePaymentId: session.payment_intent },
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
      sendOrderConfirmationEmail(order).catch(console.error);
      sendSaleNotificationEmail(order).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
