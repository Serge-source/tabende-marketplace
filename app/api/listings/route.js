import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { saveMultipleFiles } from '@/lib/upload';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where = { status: 'ACTIVE' };
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      sort === 'price_asc' ? { price: 'asc' } :
      sort === 'price_desc' ? { price: 'desc' } :
      sort === 'oldest' ? { createdAt: 'asc' } :
      { createdAt: 'desc' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, isVerified: true } },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({ listings, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const category = formData.get('category');
    const condition = formData.get('condition');
    const location = formData.get('location') || null;

    if (!title || !description || !price || !category || !condition)
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });

    let images = [];
    try { images = await saveMultipleFiles(formData, 'images'); } catch (e) { console.warn('Image upload failed, continuing without images:', e.message); }

    const listing = await prisma.listing.create({
      data: { title, description, price, category, condition, location, images, sellerId: user.id },
    });
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
