'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const CATEGORIES = ['Electronics', 'Home & Garden', 'Vehicles', 'Clothing', 'Sports', 'Toys', 'Services', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.75);
    };
    img.src = url;
  });
}

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(async (r) => {
      if (!r.ok) { router.push('/dashboard'); return; }
      const d = await r.json();
      setForm({ title: d.title, description: d.description, price: d.price, category: d.category, condition: d.condition, location: d.location || '', status: d.status });
      setPreviews(d.images || []);
    });
  }, [id]);

  const handleImages = async (e) => {
    const raw = Array.from(e.target.files).slice(0, 6);
    const compressed = await Promise.all(raw.map(compressImage));
    setImages(compressed);
    setPreviews(compressed.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));
      const res = await fetch(`/api/listings/${id}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/listings/${id}`);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return;
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard');
  };

  if (!form) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;

  return (
    <div className="section py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Edit Listing</h1>
          <p className="text-gray-500 text-sm mt-1">Update your listing details</p>
        </div>
        <button onClick={handleDelete} className="btn-danger text-sm">Delete</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">{error}</div>}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Photos</h2>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {previews.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all">
              <p className="text-sm font-medium text-gray-600">Click to replace photos</p>
              <p className="text-xs text-gray-400 mt-0.5">Up to 6 images</p>
            </div>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </label>
        </div>
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea required rows={5} className="input resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD)</label>
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">$</span><input required type="number" step="0.01" min="0" className="input pl-7" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
              <select className="input" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select className="input w-auto" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">Active — visible to buyers</option>
              <option value="DRAFT">Draft — hidden</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold rounded-2xl">
          {loading ? 'Saving...' : '✓ Save Changes'}
        </button>
      </form>
    </div>
  );
}
