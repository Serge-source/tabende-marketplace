import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth';

const BOOST_PRICE_CENTS = 500; // $5

export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (listing.sellerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Boost listing: "${listing.title}"`, description: 'Featured for 7 days' },
          unit_amount: BOOST_PRICE_CENTS,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/api/listings/${params.id}/boost/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard`,
      metadata: { listingId: params.id, type: 'boost' },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[boost POST]', err);
    return NextResponse.json({ error: err.message || 'Boost failed' }, { status: 500 });
  }
}
