'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import { useT } from '@/components/I18nProvider';

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
  const t = useT();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
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
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 px-[6%] py-16 lg:py-20 lg:min-h-[70vh]" style={{ background: 'linear-gradient(135deg, #FAFAF8, #F5F3F0)' }}>
        {/* Content */}
        <div className="flex-1 min-w-0 lg:max-w-[560px]">
          <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-5" style={{ background: '#E8F0E4', color: '#7F9B6D' }}>
            {t('home.badge')}
          </span>
          <h1 className="text-4xl sm:text-5xl xl:text-[54px] font-extrabold leading-[1.1] mb-5" style={{ color: '#2D2D2D' }}>
            {t('home.heroTitle1')}<br />{t('home.heroTitle2')}
          </h1>
          <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: '#6B6B6B' }}>
            {t('home.heroText')}
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/browse" className="px-7 py-3.5 rounded-xl font-bold text-base text-white transition-opacity hover:opacity-90" style={{ background: '#7F9B6D' }}>
              {t('home.startBrowsing')}
            </Link>
            <Link href="/listings/new" className="px-7 py-3.5 rounded-xl font-bold text-base border transition-colors hover:bg-blue-50" style={{ background: 'transparent', color: '#2D2D2D', border: '2px solid #D9D3CC' }}>
              {t('home.sellAnItem')}
            </Link>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2.5 p-3 rounded-2xl max-w-xl" style={{ background: 'white', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="flex-1 min-w-0 px-3 py-3 rounded-xl text-gray-900 text-base focus:outline-none border"
              style={{ borderColor: '#D9D3CC' }}
            />
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="hidden sm:block text-gray-600 text-sm px-3 py-3 rounded-xl focus:outline-none border flex-shrink-0"
              style={{ borderColor: '#D9D3CC' }}
            >
              <option value="">{t('home.allCategories')}</option>
              {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <button type="submit" className="text-white font-bold px-5 py-3 rounded-xl text-base transition-opacity hover:opacity-90 flex-shrink-0" style={{ background: '#7F9B6D' }}>
              {t('home.search')}
            </button>
          </form>
        </div>

        {/* Hero image */}
        <div className="w-full lg:w-[45%] lg:max-w-[600px] flex-shrink-0">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] flex items-center justify-center" style={{ background: '#C9BAB0' }}>
            <img
              src="/marketplace-hero.png"
              alt="People buying and selling online"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none" style={{ color: '#a89a8f' }}>
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm font-medium">Add marketplace-hero.png to /public</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="section py-5">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-lg mx-auto">
            {[['10K+', t('home.statListings')], ['5K+', t('home.statSellers')], ['99%', t('home.statPayments')]].map(([val, label]) => (
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
        <h2 className="text-xl font-bold text-gray-900 mb-5">{t('home.shopByCategory')}</h2>
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
              <span className="text-amber-400">★</span> {t('home.featuredListings')}
            </h2>
            <Link href="/browse" className="text-sm text-blue-600 font-medium hover:underline">{t('home.seeAll')} →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="section pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">{t('home.recentlyListed')}</h2>
          <Link href="/browse" className="text-sm text-blue-600 font-medium hover:underline">{t('home.viewAll')} →</Link>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-blue-100 text-lg mb-8">{t('home.ctaText')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg text-base">
              {t('home.getStarted')}
            </Link>
            <Link href="/browse" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-base">
              {t('home.browseListings')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
