import prisma from '@/lib/prisma';

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://tabende-marketplace-production.up.railway.app';

  const staticRoutes = ['', '/browse', '/login', '/register', '/support'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }));

  let listingRoutes = [];
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true },
      take: 1000,
      orderBy: { updatedAt: 'desc' },
    });
    listingRoutes = listings.map((l) => ({
      url: `${base}/listings/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: 'daily',
      priority: 0.6,
    }));
  } catch {
    // DB unavailable during static build — skip
  }

  return [...staticRoutes, ...listingRoutes];
}
