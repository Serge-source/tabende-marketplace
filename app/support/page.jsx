'use client';
import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'How do I create a listing?',
    a: 'Register or log in as a Seller, then click "New Listing" in the navigation bar. Follow the 3-step process: upload photos, fill in details, preview, and publish.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Tabende uses Stripe for secure payments, supporting all major credit and debit cards (Visa, Mastercard, American Express, Discover).',
  },
  {
    q: 'How does the 5% fee work?',
    a: 'Tabende charges a 5% marketplace fee on each completed sale. This fee is deducted from the sale price and the remaining 95% is paid out to the seller.',
  },
  {
    q: 'How do I contact a seller?',
    a: 'On any listing page, click the "Message Seller" button. You must be logged in to send messages. You can access all your conversations from the Messages page.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. Tabende never stores your card details. All payments are processed securely through Stripe, which is PCI DSS Level 1 certified.',
  },
  {
    q: 'How do I report a suspicious listing or user?',
    a: 'On any listing page, scroll down and click "Report this listing." Select the reason (spam, fraud, etc.), provide a description, and submit. Our team reviews all reports.',
  },
  {
    q: 'Can I edit or delete my listing?',
    a: 'Yes. Go to your Dashboard, find the listing, and click Edit or Delete. Active listings can be edited at any time. Sold listings cannot be edited.',
  },
  {
    q: 'How do I become a seller?',
    a: 'When registering, select "Seller" as your role. Existing buyers can contact support to upgrade their account to seller status.',
  },
];

export default function SupportPage() {
  const [openIdx, setOpenIdx] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    setSending(false);
  };

  return (
    <div className="section py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Find answers to common questions or get in touch with our team.</p>
      </div>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="font-medium text-gray-900 dark:text-white">{faq.q}</span>
                <svg
                  className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Send us a message and we'll get back to you within 24 hours.</p>

        {status === 'success' && (
          <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Message sent! We'll be in touch shortly.
          </div>
        )}
        {status === 'error' && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
            Something went wrong. Please email us directly at <a href="mailto:support@tabende.com" className="underline">support@tabende.com</a>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Name <span className="text-red-500">*</span></label>
              <input required className="input" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input required type="email" className="input" placeholder="jane@example.com" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject <span className="text-red-500">*</span></label>
            <select required className="input" value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}>
              <option value="">Select a topic...</option>
              <option>Account & Login</option>
              <option>Listing Issues</option>
              <option>Payment & Refunds</option>
              <option>Reporting a User</option>
              <option>Technical Problem</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message <span className="text-red-500">*</span></label>
            <textarea required rows={5} className="input resize-none" placeholder="Describe your issue in detail..." value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full py-3 font-semibold">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </div>
  );
}
