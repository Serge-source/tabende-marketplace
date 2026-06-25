'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Electronics', 'Home & Garden', 'Vehicles', 'Clothing', 'Sports', 'Toys', 'Services', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

// Resize image to max 900px on longest side and compress to ~75% JPEG quality.
// Returns a File object so it can still be appended to FormData.
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
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.75);
    };
    img.src = url;
  });
}

const conditionColor = {
  New: 'bg-green-100 text-green-700',
  'Like New': 'bg-emerald-100 text-emerald-700',
  Good: 'bg-blue-100 text-blue-700',
  Fair: 'bg-yellow-100 text-yellow-700',
  Poor: 'bg-red-100 text-red-700',
};

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', condition: '', location: '' });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImages = async (e) => {
    const raw = Array.from(e.target.files).slice(0, 6);
    const compressed = await Promise.all(raw.map(compressImage));
    setImages(compressed);
    setPreviews(compressed.map((f) => URL.createObjectURL(f)));
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setError('');
    setStep(3);
  };

  const handlePublish = async () => {
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));
      const res = await fetch('/api/listings', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/listings/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
      setStep(2);
    }
    setLoading(false);
  };

  const steps = [
    { n: 1, label: 'Photos' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Preview' },
  ];

  return (
    <div className="section py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Create a Listing</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to list your item on Tabende</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${step === s.n ? 'text-blue-600' : step > s.n ? 'text-green-600' : 'text-gray-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step === s.n ? 'border-blue-500 bg-blue-50 text-blue-600' : step > s.n ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-400'}`}>
                {step > s.n ? '✓' : s.n}
              </span>
              <span className="text-sm font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 w-8 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Step 1: Photos */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
              Photos
            </h2>
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all dark:border-gray-700 dark:hover:border-blue-500">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Upload up to 6 photos</p>
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
          <button onClick={() => setStep(2)} className="btn-primary w-full py-4 text-base font-bold rounded-2xl">
            Continue to Details →
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <form onSubmit={handleDetailsSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
              Item Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input required className="input" placeholder="What are you selling?" maxLength={100}
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea required rows={5} className="input resize-none" placeholder="Describe your item — condition, history, what's included..."
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (USD) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input required type="number" step="0.01" min="0" className="input pl-7" placeholder="0.00"
                    value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                <input className="input" placeholder="City, State"
                  value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select required className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Condition <span className="text-red-500">*</span></label>
                <select required className="input" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                  <option value="">Select condition...</option>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-4 text-base font-bold rounded-2xl">
              ← Back
            </button>
            <button type="submit" className="btn-primary flex-grow py-4 text-base font-bold rounded-2xl">
              Preview Listing →
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Here's how your listing will appear to buyers:</p>
          <div className="card overflow-hidden ring-2 ring-blue-200 dark:ring-blue-800">
            {previews.length > 0 ? (
              <div className="relative">
                <img src={previews[0]} alt={form.title} className="w-full h-72 object-cover" />
                {previews.length > 1 && (
                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                    {previews.slice(1, 4).map((src, i) => (
                      <img key={i} src={src} alt="" className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-sm" />
                    ))}
                    {previews.length > 4 && (
                      <div className="w-12 h-12 bg-black/60 rounded-lg border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        +{previews.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{form.title || 'Untitled Listing'}</h2>
                  {form.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {form.location}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-extrabold text-blue-600 whitespace-nowrap">
                  ${parseFloat(form.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {form.category && (
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                    {form.category}
                  </span>
                )}
                {form.condition && (
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${conditionColor[form.condition] || 'bg-gray-100 text-gray-600'}`}>
                    {form.condition}
                  </span>
                )}
              </div>
              {form.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {form.description}
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400">Preview only — buyers will see the full listing after publishing.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4 text-base font-bold rounded-2xl">
              ← Edit Details
            </button>
            <button onClick={handlePublish} disabled={loading} className="btn-primary flex-grow py-4 text-base font-bold rounded-2xl">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Publishing...
                </span>
              ) : 'Publish Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
