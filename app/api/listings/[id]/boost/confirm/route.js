import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { createNotification } from '@/lib/notify';

export async function GET(request, { params }) {
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId) return NextResponse.redirect(new URL('/dashboard', request.url));

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid' && session.metadata?.listingId === params.id) {
      const boostExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const listing = await prisma.listing.update({
        where: { id: params.id },
        data: { isBoosted: true, boostExpiresAt, featured: true },
      });
      await createNotification(listing.sellerId, {
        type: 'LISTING_FEATURED',
        title: 'Listing boosted!',
        body: `"${listing.title}" is now featured for 7 days.`,
        href: `/listings/${listing.id}`,
      });
    }
  } catch (err) {
    console.error('[boost confirm]', err);
  }

  return NextResponse.redirect(new URL('/dashboard?boosted=1', request.url));
}
