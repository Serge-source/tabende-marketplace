import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      listing: { select: { id: true, title: true, images: true, price: true } },
      buyer: { select: { id: true, name: true, avatar: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const unread = await prisma.message.count({
        where: { conversationId: c.id, read: false, senderId: { not: user.id } },
      });
      return { ...c, unreadCount: unread };
    })
  );
  return NextResponse.json(withUnread);
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { listingId, sellerId } = await request.json();
  if (user.id === sellerId)
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

  let conv = await prisma.conversation.findUnique({
    where: { listingId_buyerId_sellerId: { listingId, buyerId: user.id, sellerId } },
  });
  if (!conv) {
    conv = await prisma.conversation.create({ data: { listingId, buyerId: user.id, sellerId } });
  }
  return NextResponse.json(conv);
}
