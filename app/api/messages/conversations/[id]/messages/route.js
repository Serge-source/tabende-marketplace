import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notify';

export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { content } = await request.json();
  if (!content?.trim())
    return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const conv = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (conv.buyerId !== user.id && conv.sellerId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const message = await prisma.message.create({
    data: { conversationId: params.id, senderId: user.id, content: content.trim() },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });

  // Emit via Socket.io if available
  if (global._io) {
    global._io.to(`conv:${params.id}`).emit('new_message', message);
  }

  // Notify recipient
  const recipientId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId;
  createNotification(recipientId, {
    type: 'NEW_MESSAGE',
    title: `New message from ${message.sender.name}`,
    body: content.trim().slice(0, 80),
    href: `/messages`,
  }).catch(console.error);

  return NextResponse.json(message, { status: 201 });
}
