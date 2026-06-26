import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth';

const COMMISSION_RATE = 0.05; // 5% marketplace fee

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payments are not configured yet' }, { status: 503 });
    }

    const { listingId } = await request.json();
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { seller: true } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing not available' }, { status: 400 });
    if (listing.sellerId === user.id) return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 });

    const commission = Math.round(listing.price * COMMISSION_RATE * 100) / 100;
    const sellerPayout = Math.round((listing.price - commission) * 100) / 100;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Stripe only accepts http/https image URLs, not base64 data URLs
    const stripeImages = (listing.images || [])
      .filter((img) => typeof img === 'string' && img.startsWith('http'))
      .slice(0, 1);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
            description: listing.description?.slice(0, 200) || '',
            ...(stripeImages.length > 0 && { images: stripeImages }),
          },
          unit_amount: Math.round(listing.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/listings/${listingId}`,
      metadata: { listingId, buyerId: user.id, sellerId: listing.sellerId },
    });

    await prisma.order.create({
      data: {
        listingId,
        buyerId: user.id,
        sellerId: listing.sellerId,
        amount: listing.price,
        commission,
        sellerPayout,
        status: 'PENDING',
        stripeSessionId: session.id,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[checkout POST] error:', err);
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
