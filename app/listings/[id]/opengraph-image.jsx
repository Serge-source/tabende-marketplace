import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'Tabende listing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }) {
  let listing = null;
  try {
    listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: {
        title: true, price: true, category: true, condition: true, location: true,
        images: true, seller: { select: { name: true } },
      },
    });
  } catch {}

  const photo = listing?.images?.[0];
  const showPhoto = typeof photo === 'string' && (photo.startsWith('data:image') || photo.startsWith('http'));

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ffffff', fontFamily: 'sans-serif' }}>
        {/* Photo */}
        <div style={{ width: 560, height: 630, display: 'flex', background: '#eff6ff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={560} height={630} style={{ objectFit: 'cover', width: 560, height: 630 }} />
          ) : (
            <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </div>

        {/* Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 56px 48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {listing?.category && (
                <div style={{ display: 'flex', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '8px 20px', fontSize: 24 }}>
                  {listing.category}
                </div>
              )}
              {listing?.condition && (
                <div style={{ display: 'flex', background: '#f3f4f6', color: '#4b5563', borderRadius: 999, padding: '8px 20px', fontSize: 24 }}>
                  {listing.condition}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, color: '#111827', marginTop: 28, lineHeight: 1.15 }}>
              {(listing?.title || 'Listing not found').slice(0, 60)}
            </div>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#2563eb', marginTop: 24 }}>
              {listing ? `$${listing.price.toLocaleString()}` : ''}
            </div>
            {listing?.location && (
              <div style={{ display: 'flex', fontSize: 26, color: '#6b7280', marginTop: 16 }}>
                📍 {listing.location}
              </div>
            )}
          </div>

          {/* Brand footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', width: 52, height: 52, background: '#2563eb', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#111827' }}>Tabende</div>
              {listing?.seller?.name && (
                <div style={{ display: 'flex', fontSize: 22, color: '#6b7280' }}>Sold by {listing.seller.name}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
