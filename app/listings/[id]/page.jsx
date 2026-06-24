'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(async (r) => {
      if (!r.ok) { router.push('/browse'); return; }
      setListing(await r.json());
    }).finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!user) return router.push(`/login?from=/listings/${id}`);
    setBuyLoading(true); setError('');
    try {
      const res = await fetch('/api/payments/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) { setError(err.message); }
    setBuyLoading(false);
  };

  const handleMessage = async () => {
    if (!user) return router.push(`/login?from=/listings/${id}`);
    setMsgLoading(true); setError('');
    try {
      const res = await fetch('/api/messages/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: id, sellerId: listing.sellerId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/messages/${data.id}`);
    } catch (err) { setError(err.message); }
    setMsgLoading(false);
  };

  if (loading) return (
    <div className="section py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-200 rounded-3xl" />
        <div className="space-y-4"><div className="h-8 bg-gray-200 rounded-xl w-3/4" /><div className="h-10 bg-gray-200 rounded-xl w-1/3" /><div className="h-32 bg-gray-200 rounded-xl" /></div>
      </div>
    </div>
  );
  if (!listing) return null;

  const isSeller = user?.id === listing.sellerId;
  const isAvailable = listing.status === 'ACTIVE';
  const avgRating = listing.seller?.reviewsReceived?.length
    ? (listing.seller.reviewsReceived.reduce((s, r) => s + r.rating, 0) / listing.seller.reviewsReceived.length).toFixed(1) : null;

  return (
    <div className="section py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-gray-600">Home</Link><span>/</span>
        <Link href={`/browse?category=${listing.category}`} className="hover:text-gray-600">{listing.category}</Link><span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-gray-100 rounded-3xl overflow-hidden">
            {listing.images?.[imgIdx] ? (
              <img src={listing.images[imgIdx]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <svg className="h-20 w-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {listing.status === 'SOLD' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-gray-900 font-extrabold text-xl px-8 py-2 rounded-full shadow-lg">SOLD</span>
              </div>
            )}
            {listing.featured && <span className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-sm font-bold px-3 py-1 rounded-full shadow">★ Featured</span>}
          </div>
          {listing.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-blue-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{listing.title}</h1>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 mt-3">${listing.price.toLocaleString()}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="badge bg-gray-100 text-gray-700 py-1 px-3">{listing.category}</span>
            <span className="badge bg-blue-50 text-blue-700 py-1 px-3">Condition: {listing.condition}</span>
            {listing.location && <span className="badge bg-gray-100 text-gray-600 py-1 px-3 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {listing.location}
            </span>}
          </div>

          {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

          {!isSeller && isAvailable && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleBuy} disabled={buyLoading} className="btn-primary py-4 flex-1 text-base font-bold rounded-2xl">
                {buyLoading ? 'Redirecting to checkout...' : '🛒 Buy Now'}
              </button>
              <button onClick={handleMessage} disabled={msgLoading} className="btn-secondary py-4 flex-1 text-base rounded-2xl flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                {msgLoading ? 'Opening chat...' : 'Message Seller'}
              </button>
            </div>
          )}
          {!isAvailable && !isSeller && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center text-sm text-gray-500 font-medium">This item is no longer available</div>
          )}
          {isSeller && (
            <Link href={`/listings/${id}/edit`} className="btn-secondary py-3 text-center rounded-2xl">Edit Listing</Link>
          )}

          {/* Description */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-2.5">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Seller card */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seller</h3>
            <Link href={`/profile/${listing.seller.id}`} className="flex items-center gap-3 group">
              {listing.seller.avatar ? (
                <img src={listing.seller.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{listing.seller.name?.[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{listing.seller.name}</span>
                  {listing.seller.isVerified && <svg className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                </div>
                {avgRating && <div className="flex items-center gap-1 text-sm"><span className="text-amber-400">★</span><span className="font-medium">{avgRating}</span><span className="text-gray-400">({listing.seller.reviewsReceived.length})</span></div>}
                <p className="text-xs text-gray-400">{listing.seller._count?.listings || 0} listings · {listing.seller._count?.sales || 0} sales</p>
              </div>
              <svg className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
