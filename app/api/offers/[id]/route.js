import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notify';

const OFFER_TTL_MS = 48 * 60 * 60 * 1000;

async function addOfferMessage(offer, senderId, content) {
  const conversation = await prisma.conversation.findUnique({
    where: { listingId_buyerId_sellerId: { listingId: offer.listingId, buyerId: offer.buyerId, sellerId: offer.sellerId } },
  });
  if (!conversation) return null;
  await prisma.message.create({ data: { conversationId: conversation.id, senderId, content } });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
  return conversation.id;
}

// PATCH /api/offers/[id] — { action: 'accept' | 'decline' | 'cancel' | 'counter', counterAmount? }
export async function PATCH(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { action, counterAmount } = await request.json();

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: { listing: { select: { title: true, price: true, status: true } } },
  });
  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  if (offer.buyerId !== user.id && offer.sellerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (offer.status !== 'PENDING') {
    return NextResponse.json({ error: `Offer is already ${offer.status.toLowerCase()}` }, { status: 400 });
  }
  if (offer.expiresAt < new Date()) {
    await prisma.offer.update({ where: { id: offer.id }, data: { status: 'EXPIRED' } });
    return NextResponse.json({ error: 'This offer has expired' }, { status: 400 });
  }

  const isCreator = offer.createdById === user.id;
  const isRecipient = !isCreator;
  const otherPartyId = user.id === offer.buyerId ? offer.sellerId : offer.buyerId;

  if (action === 'cancel') {
    if (!isCreator) return NextResponse.json({ error: 'Only the offer creator can cancel' }, { status: 403 });
    const updated = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'CANCELLED' } });
    await addOfferMessage(offer, user.id, `↩️ Withdrew the offer of $${offer.amount.toLocaleString()}`);
    return NextResponse.json(updated);
  }

  if (action === 'decline') {
    if (!isRecipient) return NextResponse.json({ error: 'Only the recipient can decline' }, { status: 403 });
    const updated = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'DECLINED' } });
    const convId = await addOfferMessage(offer, user.id, `❌ Declined the offer of $${offer.amount.toLocaleString()}`);
    createNotification(otherPartyId, {
      type: 'ORDER_UPDATE',
      title: 'Offer declined',
      body: `Your $${offer.amount.toLocaleString()} offer for "${offer.listing.title}" was declined.`,
      href: convId ? `/messages/${convId}` : '/messages',
    }).catch(console.error);
    return NextResponse.json(updated);
  }

  if (action === 'accept') {
    if (!isRecipient) return NextResponse.json({ error: 'Only the recipient can accept' }, { status: 403 });
    if (offer.listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing is no longer available' }, { status: 400 });
    }
    const updated = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } });
    const convId = await addOfferMessage(
      offer, user.id,
      `✅ Accepted the offer of $${offer.amount.toLocaleString()}! The buyer can now complete checkout at the agreed price.`
    );
    createNotification(offer.buyerId, {
      type: 'ORDER_UPDATE',
      title: 'Offer accepted 🎉',
      body: `Your $${offer.amount.toLocaleString()} offer for "${offer.listing.title}" was accepted. Complete your purchase within 48 hours.`,
      href: `/listings/${offer.listingId}`,
    }).catch(console.error);
    return NextResponse.json({ ...updated, conversationId: convId });
  }

  if (action === 'counter') {
    if (!isRecipient) return NextResponse.json({ error: 'Only the recipient can counter' }, { status: 403 });
    const price = Number(counterAmount);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Valid counter amount required' }, { status: 400 });
    }
    if (price > offer.listing.price) {
      return NextResponse.json({ error: 'Counter cannot exceed the asking price' }, { status: 400 });
    }

    const [, counter] = await prisma.$transaction([
      prisma.offer.update({ where: { id: offer.id }, data: { status: 'COUNTERED' } }),
      prisma.offer.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          createdById: user.id,
          amount: Math.round(price * 100) / 100,
          parentId: offer.id,
          expiresAt: new Date(Date.now() + OFFER_TTL_MS),
        },
      }),
    ]);

    const convId = await addOfferMessage(offer, user.id, `🔄 Counter-offered $${counter.amount.toLocaleString()} (previous: $${offer.amount.toLocaleString()})`);
    createNotification(otherPartyId, {
      type: 'ORDER_UPDATE',
      title: 'Counter-offer received',
      body: `Counter-offer of $${counter.amount.toLocaleString()} for "${offer.listing.title}"`,
      href: convId ? `/messages/${convId}` : '/messages',
    }).catch(console.error);
    return NextResponse.json(counter, { status: 201 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
