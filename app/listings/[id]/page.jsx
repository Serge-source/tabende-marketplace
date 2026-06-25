import prisma from '@/lib/prisma';
import ListingClient from './ListingClient';

export async function generateMetadata({ params }) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://tabende-marketplace-production.up.railway.app';
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { title: true, description: true, price: true, category: true, images: true, seller: { select: { name: true } } },
    });
    if (!listing) return { title: 'Listing Not Found' };

    const description = listing.description?.slice(0, 155) || `${listing.category} listing on Tabende`;
    const image = listing.images?.[0] ? `${base}${listing.images[0]}` : undefined;

    return {
      title: listing.title,
      description,
      openGraph: {
        title: `${listing.title} — $${listing.price}`,
        description,
        type: 'website',
        ...(image && { images: [{ url: image, width: 800, height: 600 }] }),
      },
      twitter: { card: 'summary_large_image', title: listing.title, description },
    };
  } catch {
    return { title: 'Listing' };
  }
}

export default function ListingPage() {
  return <ListingClient />;
}
