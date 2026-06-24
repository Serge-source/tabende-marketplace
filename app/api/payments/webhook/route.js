import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

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
  }

  return NextResponse.json({ received: true });
}
