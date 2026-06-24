import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { saveMultipleFiles } from '@/lib/upload';

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

  const formData = await request.formData();
  let newImages = [];
  try { newImages = await saveMultipleFiles(formData, 'images'); } catch (e) { console.warn('Image upload failed:', e.message); }

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      title: formData.get('title') || listing.title,
      description: formData.get('description') || listing.description,
      price: formData.get('price') ? parseFloat(formData.get('price')) : listing.price,
      category: formData.get('category') || listing.category,
      condition: formData.get('condition') || listing.condition,
      location: formData.get('location') ?? listing.location,
      status: formData.get('status') || listing.status,
      images: newImages.length ? newImages : listing.images,
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
