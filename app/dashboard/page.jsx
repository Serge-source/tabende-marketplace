'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const SHIP_STEPS = ['ORDER_PLACED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const SHIP_LABELS = { ORDER_PLACED: 'Order Placed', SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered' };

function ShippingTracker({ status }) {
  const idx = SHIP_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {SHIP_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${i <= idx ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}>
            {i < idx && <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            {i === idx && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          {i < SHIP_STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < idx ? 'bg-blue-600' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (!user) return;
    const validTabs = ['listings', 'orders', 'sales', 'favorites', 'analytics'];
    if (!validTabs.includes(tab)) {
      setTab(user.role === 'SELLER' || user.role === 'ADMIN' ? 'listings' : 'orders');
      return;
    }
    setLoading(true);
    setData([]);
    const ep = { listings: '/api/users/me/listings', orders: '/api/orders', sales: '/api/orders/sales', favorites: '/api/users/me/favorites', analytics: '/api/analytics/seller' };
    fetch(ep[tab]).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [tab, user]);

  const submitReview = async () => {
    const res = await fetch(`/api/orders/${reviewOrder.id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewForm) });
    if (res.ok) {
      setData((prev) => prev.map((o) => o.id === reviewOrder.id ? { ...o, review: { rating: reviewForm.rating } } : o));
      setReviewOrder(null);
    }
  };

  const updateShipping = async (orderId, shippingStatus) => {
    await fetch(`/api/orders/${orderId}/shipping`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shippingStatus }) });
    setData((prev) => prev.map((o) => o.id === orderId ? { ...o, shippingStatus } : o));
  };

  if (!user) return null;

  const tabs = [
    ...(user.role !== 'BUYER' ? [{ key: 'listings', label: 'My Listings' }] : []),
    { key: 'orders', label: 'Orders' },
    ...(user.role !== 'BUYER' ? [{ key: 'sales', label: 'Sales' }, { key: 'analytics', label: 'Analytics' }] : []),
    { key: 'favorites', label: 'Saved' },
  ];

  return (
    <div className="section py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, <span className="font-medium text-gray-700">{user.name}</span></p>
        </div>
        {user.role !== 'BUYER' && (
          <Link href="/listings/new" className="btn-primary">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Listing
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg ${tab === t.key ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : (Array.isArray(data) && data.length === 0) ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 font-medium">Nothing here yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {tab === 'listings' ? 'Create your first listing to start selling' : tab === 'orders' ? 'Browse listings to make your first purchase' : 'Items you save will appear here'}
          </p>
          {tab === 'listings' && <Link href="/listings/new" className="btn-primary mt-4 inline-flex">Create Listing</Link>}
          {tab === 'orders' && <Link href="/browse" className="btn-primary mt-4 inline-flex">Browse</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'listings' && data.map((l) => (
            <div key={l.id} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/listings/${l.id}`} className="font-semibold text-gray-900 hover:text-blue-600 truncate block">{l.title}</Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-bold text-blue-600">${l.price.toLocaleString()}</span>
                  <span className={`badge text-xs ${l.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : l.status === 'SOLD' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>{l.status}</span>
                  {l.isBoosted && <span className="badge text-xs bg-amber-50 text-amber-700">★ Boosted</span>}
                  <span className="text-xs text-gray-400 flex items-center gap-1"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{l._count?.favorites || 0}</span>
                  {l.status === 'ACTIVE' && (() => {
                    if (!l.expiresAt) return <span className="text-xs text-gray-400">No expiry</span>;
                    const daysLeft = Math.ceil((new Date(l.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 0) return <span className="text-xs text-red-500 font-medium">Expired</span>;
                    if (daysLeft <= 7) return <span className="text-xs text-red-500 font-medium">Expires in {daysLeft}d</span>;
                    if (daysLeft <= 14) return <span className="text-xs text-orange-500">Expires in {daysLeft}d</span>;
                    return <span className="text-xs text-gray-400">Expires {new Date(l.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(l.status === 'SOLD' || (l.expiresAt && new Date(l.expiresAt) < new Date())) && (
                  <button onClick={async () => {
                    const res = await fetch(`/api/listings/${l.id}/relist`, { method: 'POST' });
                    if (res.ok) setData((prev) => prev.map((x) => x.id === l.id ? { ...x, status: 'ACTIVE', expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() } : x));
                  }} className="btn-secondary text-xs px-3 py-1.5">Relist</button>
                )}
                {l.status === 'ACTIVE' && !l.isBoosted && (
                  <button onClick={async () => {
                    const res = await fetch(`/api/listings/${l.id}/boost`, { method: 'POST' });
                    const d = await res.json();
                    if (d.url) window.location.href = d.url;
                  }} className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-medium transition-colors">★ Boost $5</button>
                )}
                <Link href={`/listings/${l.id}/edit`} className="btn-secondary text-xs px-3 py-1.5">Edit</Link>
              </div>
            </div>
          ))}

          {tab === 'orders' && data.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {o.listing?.images?.[0] ? <img src={o.listing.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${o.listing?.id}`} className="font-semibold text-gray-900 hover:text-blue-600 block truncate">{o.listing?.title}</Link>
                  <p className="text-xs text-gray-500 mt-0.5">Seller: <span className="font-medium">{o.seller?.name}</span></p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-bold text-blue-600">${o.amount.toLocaleString()}</span>
                    <span className={`badge text-xs ${o.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                  </div>
                </div>
                {o.status === 'PAID' && !o.review && (
                  <button onClick={() => setReviewOrder(o)} className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">Rate Seller</button>
                )}
                {o.review && <div className="flex items-center gap-0.5 flex-shrink-0"><span className="text-amber-400 text-sm">{'★'.repeat(o.review.rating)}</span></div>}
              </div>
              {o.status === 'PAID' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shipping</p>
                    <span className="text-xs text-blue-600 font-medium">{SHIP_LABELS[o.shippingStatus]}</span>
                  </div>
                  <ShippingTracker status={o.shippingStatus} />
                </div>
              )}
            </div>
          ))}

          {tab === 'sales' && data.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {o.listing?.images?.[0] ? <img src={o.listing.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{o.listing?.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Buyer: <span className="font-medium">{o.buyer?.name}</span></p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-bold text-emerald-600">+${o.amount.toLocaleString()}</span>
                    <span className={`badge text-xs ${o.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                  </div>
                </div>
                {o.status === 'PAID' && (
                  <div className="flex-shrink-0">
                    <select value={o.shippingStatus} onChange={(e) => updateShipping(o.id, e.target.value)} className="input text-xs w-auto py-1.5">
                      {SHIP_STEPS.map((s) => <option key={s} value={s}>{SHIP_LABELS[s]}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}

          {tab === 'analytics' && data.overview && (
            <div className="space-y-6">
              {/* Overview cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Listings', val: data.overview.totalListings, icon: '📦', color: 'bg-blue-50 text-blue-600' },
                  { label: 'Active', val: data.overview.activeListings, icon: '✅', color: 'bg-green-50 text-green-600' },
                  { label: 'Total Sales', val: data.overview.totalSales, icon: '🛒', color: 'bg-purple-50 text-purple-600' },
                  { label: 'Total Favorites', val: data.overview.favorites, icon: '❤️', color: 'bg-red-50 text-red-600' },
                ].map((s) => (
                  <div key={s.label} className="card p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.color}`}>{s.icon}</div>
                    <div><p className="text-xl font-extrabold text-gray-900">{s.val}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                  </div>
                ))}
              </div>

              {/* Revenue last 30 days */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-1">Revenue (Last 30 Days)</h3>
                <p className="text-3xl font-extrabold text-emerald-600">${data.revenue.last30Days.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">After 5% marketplace commission</p>
                {Object.keys(data.revenue.salesByDay).length > 0 && (
                  <div className="mt-4 flex items-end gap-1 h-20">
                    {Object.entries(data.revenue.salesByDay).slice(-14).map(([day, rev]) => {
                      const max = Math.max(...Object.values(data.revenue.salesByDay));
                      const h = max > 0 ? Math.round((rev / max) * 100) : 0;
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: $${rev.toFixed(2)}`}>
                          <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${h}%`, minHeight: '2px' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top listings */}
              {data.topListings?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Top Listings by Favorites</h3>
                  <div className="space-y-2">
                    {data.topListings.map((l, i) => (
                      <div key={l.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                        <Link href={`/listings/${l.id}`} className="flex-1 text-sm font-medium text-gray-900 hover:text-blue-600 truncate">{l.title}</Link>
                        <span className="text-sm font-bold text-blue-600 flex-shrink-0">${l.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">❤️ {l._count.favorites}</span>
                        <span className={`badge text-xs flex-shrink-0 ${l.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'favorites' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.map((l) => (
                <Link key={l.id} href={`/listings/${l.id}`} className="card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="aspect-[4/3] bg-gray-100">{l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}</div>
                  <div className="p-3"><p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p><p className="text-sm font-bold text-blue-600 mt-1">${l.price.toLocaleString()}</p></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review modal */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Rate your experience</h3>
            <p className="text-sm text-gray-500 mb-4">How was your purchase from <span className="font-medium">{reviewOrder.seller?.name}</span>?</p>
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map((n) => (
                <button key={n} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))} className={`text-3xl transition-transform hover:scale-110 ${n <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
            <textarea rows={3} className="input resize-none mb-4" placeholder="Share your experience (optional)..."
              value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={submitReview} className="btn-primary flex-1">Submit Review</button>
              <button onClick={() => setReviewOrder(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
