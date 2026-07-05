import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { rateLimit } from '@/lib/rateLimit';

const OFFER_TTL_MS = 48 * 60 * 60 * 1000; // offers expire after 48h
const MIN_OFFER_RATIO = 0.1; // lowball floor: 10% of asking price

// POST /api/offers — buyer makes an offer on a listing
export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { allowed } = rateLimit({ key: `offer:${user.id}`, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: 'Too many offers — try again later' }, { status: 429 });

  const { listingId, amount } = await request.json();
  const price = Number(amount);
  if (!listingId || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Valid listing and amount required' }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing is not available' }, { status: 400 });
  if (listing.sellerId === user.id) return NextResponse.json({ error: 'Cannot make an offer on your own listing' }, { status: 400 });
  if (price < listing.price * MIN_OFFER_RATIO) {
    return NextResponse.json({ error: `Offer too low — minimum is $${(listing.price * MIN_OFFER_RATIO).toFixed(2)}` }, { status: 400 });
  }
  if (price >= listing.price) {
    return NextResponse.json({ error: 'Offer is at or above asking price — use Buy Now instead' }, { status: 400 });
  }

  // One live offer per buyer per listing: cancel any previous pending one
  await prisma.offer.updateMany({
    where: { listingId, buyerId: user.id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });

  const offer = await prisma.offer.create({
    data: {
      listingId,
      buyerId: user.id,
      sellerId: listing.sellerId,
      createdById: user.id,
      amount: Math.round(price * 100) / 100,
      expiresAt: new Date(Date.now() + OFFER_TTL_MS),
    },
  });

  // Surface the offer in the conversation thread
  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId_sellerId: { listingId, buyerId: user.id, sellerId: listing.sellerId } },
    create: { listingId, buyerId: user.id, sellerId: listing.sellerId },
    update: { updatedAt: new Date() },
  });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: `💰 Made an offer: $${offer.amount.toLocaleString()} (asking $${listing.price.toLocaleString()})`,
    },
  });

  createNotification(listing.sellerId, {
    type: 'ORDER_UPDATE',
    title: 'New offer received',
    body: `${user.name} offered $${offer.amount.toLocaleString()} for "${listing.title}"`,
    href: `/messages/${conversation.id}`,
  }).catch(console.error);

  return NextResponse.json({ ...offer, conversationId: conversation.id }, { status: 201 });
}

// GET /api/offers?listingId=&buyerId= — offers visible to the current user
export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

  const offers = await prisma.offer.findMany({
    where: {
      listingId,
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json(offers);
}
