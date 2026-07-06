import { prisma } from '@/lib/prisma';
import ListingClient from './ListingClient';

export async function generateMetadata({ params }) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { title: true, description: true, price: true, category: true, images: true, seller: { select: { name: true } } },
    });
    if (!listing) return { title: 'Listing Not Found' };

    const description = listing.description?.slice(0, 155) || `${listing.category} listing on Tabende`;

    // og:image comes from the opengraph-image.jsx file convention,
    // which renders a branded card with the listing photo
    return {
      title: listing.title,
      description,
      openGraph: {
        title: `${listing.title} — $${listing.price}`,
        description,
        type: 'website',
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
