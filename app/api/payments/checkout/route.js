import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { listingId } = await request.json();
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { seller: true } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing not available' }, { status: 400 });
  if (listing.sellerId === user.id) return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: listing.title,
          description: listing.description.slice(0, 200),
        },
        unit_amount: Math.round(listing.price * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/listings/${listingId}`,
    metadata: { listingId, buyerId: user.id, sellerId: listing.sellerId },
  });

  await prisma.order.create({
    data: {
      listingId,
      buyerId: user.id,
      sellerId: listing.sellerId,
      amount: listing.price,
      status: 'PENDING',
      stripeSessionId: session.id,
    },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
