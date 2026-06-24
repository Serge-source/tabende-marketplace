'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [tab, setTab] = useState('listings');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(tab === 'users' ? '/api/admin/users' : '/api/admin/listings')
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [tab]);

  const patchListing = async (id, body) => {
    await fetch(`/api/admin/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setData((prev) => prev.map((l) => l.id === id ? { ...l, ...body } : l));
  };

  const patchUser = async (id, body) => {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setData((prev) => prev.map((u) => u.id === id ? { ...u, ...body } : u));
  };

  return (
    <div className="section py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Manage listings, users, and platform settings</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', val: stats.users.toLocaleString(), icon: '👤', color: 'bg-blue-50 text-blue-600' },
            { label: 'Total Listings', val: stats.listings.toLocaleString(), icon: '📦', color: 'bg-green-50 text-green-600' },
            { label: 'Paid Orders', val: stats.orders.toLocaleString(), icon: '✅', color: 'bg-purple-50 text-purple-600' },
            { label: 'Revenue', val: `$${stats.revenue.toLocaleString()}`, icon: '💰', color: 'bg-amber-50 text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-gray-200 mb-6">
        {['listings', 'users'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize rounded-t-lg transition-colors ${tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t === 'listings' ? 'Moderation' : 'Users'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : (
        <div className="space-y-3">
          {tab === 'listings' && data.map((l) => (
            <div key={l.id} className="card p-4 flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{l.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{l.seller?.name} · {l.seller?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`badge text-xs ${l.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : l.status === 'SUSPENDED' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{l.status}</span>
                  <span className="font-bold text-blue-600 text-sm">${l.price.toLocaleString()}</span>
                  {l.featured && <span className="badge bg-amber-50 text-amber-700 text-xs">★ Featured</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {l.status !== 'ACTIVE' && <button onClick={() => patchListing(l.id, { status: 'ACTIVE' })} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium">Approve</button>}
                {l.status !== 'SUSPENDED' && <button onClick={() => patchListing(l.id, { status: 'SUSPENDED' })} className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium">Suspend</button>}
                <button onClick={() => patchListing(l.id, { featured: !l.featured })} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-medium">
                  {l.featured ? 'Unfeature' : '★ Feature'}
                </button>
              </div>
            </div>
          ))}

          {tab === 'users' && data.map((u) => (
            <div key={u.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">{u.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">{u.role.toLowerCase()}</span>
                  {u.isVerified && <span className="badge bg-blue-50 text-blue-700 text-xs">✓ Verified</span>}
                  <span className="text-xs text-gray-400">{u._count?.listings || 0} listings · {u._count?.orders || 0} orders</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                <button onClick={() => patchUser(u.id, { isVerified: !u.isVerified })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${u.isVerified ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>
                  {u.isVerified ? 'Unverify' : 'Verify'}
                </button>
                {u.role !== 'ADMIN' && (
                  <button onClick={() => patchUser(u.id, { role: u.role === 'SELLER' ? 'BUYER' : 'SELLER' })}
                    className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 font-medium">
                    → {u.role === 'SELLER' ? 'Buyer' : 'Seller'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {data.length === 0 && <div className="card p-12 text-center text-gray-400">Nothing to show</div>}
        </div>
      )}
    </div>
  );
}
