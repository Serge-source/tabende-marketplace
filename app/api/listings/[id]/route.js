import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: {
        select: {
          id: true, name: true, avatar: true, bio: true, isVerified: true, createdAt: true,
          reviewsReceived: { select: { rating: true } },
          _count: { select: { listings: true, sales: true } },
        },
      },
      _count: { select: { favorites: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.sellerId !== user.id && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { title, description, price, category, condition, location, status, images } = body;

  const validImages = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string' && (img.startsWith('data:image/') || img.startsWith('/')))
    : null;

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      title: title || listing.title,
      description: description || listing.description,
      price: price ? parseFloat(price) : listing.price,
      category: category || listing.category,
      condition: condition || listing.condition,
      location: location ?? listing.location,
      status: status || listing.status,
      images: validImages !== null ? validImages : listing.images,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.sellerId !== user.id && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
