'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Electronics', 'Home & Garden', 'Vehicles', 'Clothing', 'Sports', 'Toys', 'Services', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', condition: '', location: '' });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 6);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category || !form.condition) { setError('Please select category and condition'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));
      const res = await fetch('/api/listings', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/listings/${data.id}`);
    } catch (err) { setError(err.message || 'Failed to create listing'); }
    setLoading(false);
  };

  return (
    <div className="section py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Create a Listing</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to list your item on Tabende</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>}

        {/* Photos */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
            Photos
          </h2>
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Upload up to 6 photos</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB each</p>
            </div>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">Main</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
            Item Details
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input required className="input" placeholder="What are you selling?" maxLength={100}
              value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea required rows={5} className="input resize-none" placeholder="Describe your item — condition, history, what's included..."
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input required type="number" step="0.01" min="0" className="input pl-7" placeholder="0.00"
                  value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input className="input" placeholder="City, State"
                value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select required className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition <span className="text-red-500">*</span></label>
              <select required className="input" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                <option value="">Select condition...</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold rounded-2xl">
          {loading ? (
            <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Publishing...</span>
          ) : '🚀 Publish Listing'}
        </button>
      </form>
    </div>
  );
}
