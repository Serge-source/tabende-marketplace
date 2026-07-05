import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notify';
import { rateLimit } from '@/lib/rateLimit';

const DISPUTE_REASONS = ['ITEM_NOT_RECEIVED', 'NOT_AS_DESCRIBED', 'OTHER'];

// POST /api/orders/[id]/dispute — buyer files a dispute on a PAID order
export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { allowed } = rateLimit({ key: `dispute:${user.id}`, limit: 5, windowMs: 24 * 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: 'Too many disputes filed today' }, { status: 429 });

  const { reason, description } = await request.json();
  if (!DISPUTE_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid dispute reason' }, { status: 400 });
  }
  if (!description?.trim() || description.trim().length < 20) {
    return NextResponse.json({ error: 'Please describe the problem in at least 20 characters' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { listing: { select: { id: true, title: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.buyerId !== user.id) return NextResponse.json({ error: 'Only the buyer can dispute an order' }, { status: 403 });
  if (order.status !== 'PAID') {
    return NextResponse.json({ error: 'Only paid orders can be disputed' }, { status: 400 });
  }

  const existing = await prisma.report.findFirst({
    where: { orderId: order.id, status: { in: ['PENDING', 'REVIEWING'] } },
  });
  if (existing) return NextResponse.json({ error: 'A dispute for this order is already open' }, { status: 400 });

  const report = await prisma.report.create({
    data: {
      reason,
      description: description.trim().slice(0, 2000),
      reporterId: user.id,
      reportedUserId: order.sellerId,
      listingId: order.listingId,
      orderId: order.id,
    },
  });

  createNotification(order.sellerId, {
    type: 'REPORT_UPDATE',
    title: 'Dispute opened on your sale',
    body: `The buyer opened a dispute on "${order.listing.title}" (${reason.replaceAll('_', ' ').toLowerCase()}). Our team will review it.`,
    href: '/dashboard',
  }).catch(console.error);

  return NextResponse.json(report, { status: 201 });
}
