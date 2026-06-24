import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, images: true, price: true, status: true } },
      buyer: { select: { id: true, name: true, avatar: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (conv.buyerId !== user.id && conv.sellerId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.message.updateMany({
    where: { conversationId: params.id, senderId: { not: user.id }, read: false },
    data: { read: true },
  });

  return NextResponse.json(conv);
}
