'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ListingCard from '@/components/ListingCard';

export default function ProfilePage() {
  const { id } = useParams();
  const { user, updateUser, refetch } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', role: '' });
  const [avatarDataURL, setAvatarDataURL] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwn = user?.id === id;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${id}`).then((r) => r.json()).then((d) => {
      setProfile(d);
      setForm({ name: d.name, bio: d.bio || '', role: d.role });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarDataURL(ev.target.result);
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const payload = { name: form.name, bio: form.bio, role: form.role };
    if (avatarDataURL) payload.avatar = avatarDataURL;
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      updateUser(d);
      setProfile((p) => ({ ...p, ...d }));
      setEditing(false);
      await refetch();
    }
    setSaving(false);
  };

  const avgRating = profile?.reviewsReceived?.length
    ? (profile.reviewsReceived.reduce((s, r) => s + r.rating, 0) / profile.reviewsReceived.length).toFixed(1) : null;

  if (loading) return <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  if (!profile) return null;

  return (
    <div className="section py-8 max-w-4xl">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {(avatarPreview || profile.avatar) ? (
              <img src={avatarPreview || profile.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-extrabold">{profile.name[0]}</div>
            )}
            {isOwn && editing && (
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input className="input text-lg font-bold" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <textarea rows={2} className="input resize-none" placeholder="Tell buyers about yourself..." value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Account type</label>
                  <select className="input w-auto text-sm" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="BUYER">Buyer</option>
                    <option value="SELLER">Seller</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-gray-900">{profile.name}</h1>
                  {profile.isVerified && <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  <span className="badge bg-blue-50 text-blue-700 capitalize">{profile.role.toLowerCase()}</span>
                </div>
                {avgRating && <div className="flex items-center gap-1.5 mt-1.5"><span className="text-amber-400">★</span><span className="font-semibold text-sm">{avgRating}</span><span className="text-gray-400 text-sm">({profile.reviewsReceived.length} reviews)</span></div>}
                {profile.bio && <p className="text-gray-600 text-sm mt-2 leading-relaxed">{profile.bio}</p>}
                <div className="flex gap-4 mt-3 text-sm text-gray-400">
                  <span><span className="font-semibold text-gray-700">{profile._count?.listings || 0}</span> listings</span>
                  <span><span className="font-semibold text-gray-700">{profile._count?.sales || 0}</span> sales</span>
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                {isOwn && <button onClick={() => setEditing(true)} className="btn-secondary text-sm mt-3">Edit Profile</button>}
              </>
            )}
          </div>
        </div>
      </div>

      {profile.listings?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Active Listings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}

      {profile.reviewsReceived?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Reviews</h2>
          <div className="space-y-3">
            {profile.reviewsReceived.map((r) => (
              <div key={r.id} className="card p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">{r.reviewer?.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/profile/${r.reviewer?.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">{r.reviewer?.name}</Link>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-amber-400 text-sm mt-0.5">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                  {r.comment && <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
