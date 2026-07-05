import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { isStorageConfigured, migrateDataUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Migrates legacy base64 images to R2, a few listings per call.
// Call repeatedly until { remaining: 0 }.
export async function POST(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: 'R2 storage is not configured' }, { status: 503 });
  }

  // String[] can't be filtered by prefix in Prisma, so scan in id order
  const listings = await prisma.listing.findMany({
    select: { id: true, images: true },
    orderBy: { id: 'asc' },
  });

  const pending = listings.filter((l) => (l.images || []).some((img) => img.startsWith('data:')));
  const batch = pending.slice(0, 5);

  const results = [];
  for (const listing of batch) {
    const images = [];
    for (const img of listing.images) {
      if (img.startsWith('data:')) {
        try {
          images.push(await migrateDataUrl(img, { folder: 'listings' }));
        } catch (err) {
          console.error(`[migrate-images] listing ${listing.id}:`, err.message);
          // keep the original so nothing is lost; it will be retried next run
          images.push(img);
        }
      } else {
        images.push(img);
      }
    }
    await prisma.listing.update({ where: { id: listing.id }, data: { images } });
    results.push(listing.id);
  }

  return NextResponse.json({
    migrated: results.length,
    listingIds: results,
    remaining: pending.length - batch.length,
  });
}
