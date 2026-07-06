'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/I18nProvider';

function RegisterForm() {
  const { login } = useAuth();
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const referralCode = params.get('ref') || null;
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'BUYER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user);
      // Hard navigation clears the pre-auth router cache (see login page)
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t('auth.createAccount')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('auth.createSubtitle')}</p>
          {referralCode && (
            <p className="mt-3 inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
              🎁 {t('auth.invitedByFriend')}
            </p>
          )}
        </div>
        <div className="card p-8">
          {error && <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.fullName')}</label>
              <input type="text" required className="input" placeholder="John Doe"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <input type="password" required className="input" placeholder={t('auth.passwordMin')}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.iWantTo')}</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'BUYER', label: t('auth.buyItems'), desc: t('auth.buyItemsDesc'), emoji: '🛍️' },
                  { role: 'SELLER', label: t('auth.sellItems'), desc: t('auth.sellItemsDesc'), emoji: '💰' },
                ].map((opt) => (
                  <button key={opt.role} type="button" onClick={() => setForm((f) => ({ ...f, role: opt.role }))}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-150 ${form.role === opt.role ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <div className="text-2xl mb-1.5">{opt.emoji}</div>
                    <div className={`text-sm font-semibold ${form.role === opt.role ? 'text-blue-700' : 'text-gray-900'}`}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-gray-500 leading-relaxed">
                {t('auth.agreeTo')} <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">{t('auth.terms')}</Link> {t('auth.and')} <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">{t('auth.privacy')}</Link>
              </span>
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('auth.creatingAccount')}</span>
              ) : t('auth.createAccountBtn')}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">{t('auth.signInLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
