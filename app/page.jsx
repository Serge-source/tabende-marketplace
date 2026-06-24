'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = [
  { name: 'Electronics', icon: '💻' },
  { name: 'Home & Garden', icon: '🏡' },
  { name: 'Vehicles', icon: '🚗' },
  { name: 'Clothing', icon: '👕' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Toys', icon: '🧸' },
  { name: 'Services', icon: '🛠️' },
  { name: 'Other', icon: '📦' },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/listings/featured').then((r) => r.json()),
      fetch('/api/listings?limit=8').then((r) => r.json()),
    ]).then(([feat, rec]) => {
      setFeatured(feat);
      setRecent(rec.listings || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) router.push(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white py-24 px-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.04%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-100" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Trusted by thousands of buyers & sellers
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
            Buy & Sell<br />with Confidence
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-xl mx-auto font-light">
            Tabende connects buyers and sellers in a secure, verified marketplace with real-time chat and safe payments.
          </p>
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl"
              />
            </div>
            <button type="submit" className="bg-white text-blue-700 font-bold px-7 py-4 rounded-2xl hover:bg-blue-50 transition-colors shadow-xl text-base whitespace-nowrap">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="section py-5">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-lg mx-auto">
            {[['10K+', 'Active Listings'], ['5K+', 'Happy Sellers'], ['99%', 'Secure Payments']].map(([val, label]) => (
              <div key={label}>
                <p className="text-xl sm:text-2xl font-extrabold text-blue-600">{val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Shop by Category</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} href={`/browse?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all duration-150 group">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="section pb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-amber-400">★</span> Featured Listings
            </h2>
            <Link href="/browse" className="text-sm text-blue-600 font-medium hover:underline">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="section pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Recently Listed</h2>
          <Link href="/browse" className="text-sm text-blue-600 font-medium hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3.5 space-y-2.5">
                  <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
                  <div className="h-3 bg-gray-200 rounded-lg w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to start selling?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of sellers already earning on Tabende. List your first item in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg text-base">
              Get Started Free
            </Link>
            <Link href="/browse" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-base">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
