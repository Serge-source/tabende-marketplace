'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

const COND_COLORS = {
  New: 'bg-emerald-50 text-emerald-700',
  'Like New': 'bg-blue-50 text-blue-700',
  Good: 'bg-amber-50 text-amber-700',
  Fair: 'bg-orange-50 text-orange-700',
  Poor: 'bg-red-50 text-red-700',
};

export default function ListingCard({ listing }) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleFav = async (e) => {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, { method: 'POST' });
      const data = await res.json();
      setFav(data.favorited);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} className="card group flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {listing.featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">★ Featured</span>
        )}
        {listing.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white text-gray-800 font-extrabold text-sm px-5 py-1.5 rounded-full shadow">SOLD</span>
          </div>
        )}

        {user && (
          <button onClick={toggleFav} disabled={busy} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-150">
            <svg className={`h-3.5 w-3.5 transition-colors ${fav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">{listing.title}</p>
          <p className="text-base font-extrabold text-blue-600 whitespace-nowrap">${listing.price.toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={`badge ${COND_COLORS[listing.condition] || 'bg-gray-100 text-gray-600'}`}>{listing.condition}</span>
          <span className="badge bg-gray-100 text-gray-500">{listing.category}</span>
        </div>

        {listing.seller && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-50 mt-auto">
            {listing.seller.avatar ? (
              <img src={listing.seller.avatar} alt="" className="w-4.5 h-4.5 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                {listing.seller.name?.[0]}
              </div>
            )}
            <span className="text-xs text-gray-400 truncate flex-1">{listing.seller.name}</span>
            {listing.seller.isVerified && (
              <svg className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
