import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const MAX_SAVED = 10;

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const searches = await prisma.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(searches);
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { query, category, location, minPrice, maxPrice } = await request.json();
  const q = query?.trim() || null;
  const cat = category?.trim() || null;
  const loc = location?.trim() || null;
  if (!q && !cat && !loc) {
    return NextResponse.json({ error: 'Add a search term, category, or location first' }, { status: 400 });
  }

  const count = await prisma.savedSearch.count({ where: { userId: user.id } });
  if (count >= MAX_SAVED) {
    return NextResponse.json({ error: `You can save up to ${MAX_SAVED} searches — delete one first` }, { status: 400 });
  }

  const dup = await prisma.savedSearch.findFirst({
    where: { userId: user.id, query: q, category: cat, location: loc },
  });
  if (dup) return NextResponse.json({ error: 'You already saved this search' }, { status: 400 });

  const saved = await prisma.savedSearch.create({
    data: {
      userId: user.id,
      query: q,
      category: cat,
      location: loc,
      minPrice: Number.isFinite(Number(minPrice)) && minPrice !== '' && minPrice != null ? Number(minPrice) : null,
      maxPrice: Number.isFinite(Number(maxPrice)) && maxPrice !== '' && maxPrice != null ? Number(maxPrice) : null,
    },
  });
  return NextResponse.json(saved, { status: 201 });
}
