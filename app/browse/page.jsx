'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = ['Electronics', 'Home & Garden', 'Vehicles', 'Clothing', 'Sports', 'Toys', 'Services', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

function Skeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
        <div className="h-3 bg-gray-200 rounded-lg w-2/5" />
        <div className="flex gap-2 pt-1"><div className="h-5 w-14 bg-gray-200 rounded-full" /><div className="h-5 w-20 bg-gray-200 rounded-full" /></div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const sp = (key) => searchParams.get(key) || '';
  const category = sp('category');
  const condition = sp('condition');
  const search = sp('search');
  const sort = sp('sort') || 'newest';
  const minPrice = sp('minPrice');
  const maxPrice = sp('maxPrice');
  const page = parseInt(sp('page') || '1');

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    router.push(`/browse?${p.toString()}`);
  };

  const reset = () => router.push('/browse');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (condition) p.set('condition', condition);
    if (search) p.set('search', search);
    if (sort) p.set('sort', sort);
    if (minPrice) p.set('minPrice', minPrice);
    if (maxPrice) p.set('maxPrice', maxPrice);
    p.set('page', page);
    p.set('limit', '12');
    const res = await fetch(`/api/listings?${p.toString()}`);
    const data = await res.json();
    setListings(data.listings || []);
    setTotal(data.total || 0);
    setPages(data.pages || 1);
    setLoading(false);
  }, [category, condition, search, sort, minPrice, maxPrice, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const hasFilters = category || condition || minPrice || maxPrice;

  return (
    <div className="section py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `"${search}"` : category || 'All Listings'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterOpen((o) => !o)} className="sm:hidden btn-secondary gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          </button>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="input w-auto text-sm bg-white">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`${filterOpen ? 'block' : 'hidden'} sm:block w-full sm:w-56 flex-shrink-0`}>
          <div className="card p-5 space-y-5 sm:sticky sm:top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">Filters</h3>
              {hasFilters && <button onClick={reset} className="text-xs text-blue-600 hover:underline font-medium">Clear all</button>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
              {['', ...CATEGORIES].map((cat) => (
                <button key={cat} onClick={() => setParam('category', cat)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${category === cat ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {cat || 'All Categories'}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Condition</label>
              <select value={condition} onChange={(e) => setParam('condition', e.target.value)} className="input text-sm">
                <option value="">Any Condition</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range (USD)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" className="input text-sm" value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)} />
                <span className="text-gray-400 flex-shrink-0">—</span>
                <input type="number" placeholder="Max" className="input text-sm" value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)} />
              </div>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700">No listings found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
              <button onClick={reset} className="btn-secondary mt-4 text-sm">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              {pages > 1 && (
                <div className="flex justify-center gap-1.5 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setParam('page', p.toString())}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
