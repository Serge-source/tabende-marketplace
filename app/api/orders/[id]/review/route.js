import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { sendReviewEmail } from '@/lib/email';

export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { rating, comment } = await request.json();
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: 'Rating 1-5 required' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.buyerId !== user.id) return NextResponse.json({ error: 'Only buyer can review' }, { status: 403 });
  if (order.status !== 'PAID') return NextResponse.json({ error: 'Order must be paid' }, { status: 400 });

  try {
    const review = await prisma.review.create({
      data: { orderId: order.id, reviewerId: user.id, revieweeId: order.sellerId, rating, comment },
    });

    const seller = await prisma.user.findUnique({ where: { id: order.sellerId }, select: { id: true, name: true, email: true } });
    if (seller) {
      createNotification(seller.id, {
        type: 'NEW_REVIEW',
        title: `New ${rating}-star review`,
        body: comment ? comment.slice(0, 80) : `You received a ${rating}-star rating.`,
        href: `/profile/${seller.id}`,
      }).catch(console.error);
      sendReviewEmail(seller, { name: user.name }, rating).catch(console.error);
    }

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
  }
}
