import Link from 'next/link';

export const metadata = { title: 'How it Works — Tabende' };

const BUYER_STEPS = [
  { icon: '🔍', title: 'Browse & search', text: 'Explore listings by category, location, and price — or save a search and get notified when new matches appear.' },
  { icon: '💬', title: 'Message or make an offer', text: 'Chat with sellers in real time, ask questions, and negotiate the price with offers and counter-offers.' },
  { icon: '💳', title: 'Pay securely', text: 'Checkout is handled by Stripe — your card details never touch our servers. Store credit from referrals is applied automatically.' },
  { icon: '📦', title: 'Track & review', text: 'Follow your order from placed to delivered, then rate the seller. If something goes wrong, open a dispute and our team steps in.' },
];

const SELLER_STEPS = [
  { icon: '📸', title: 'List in minutes', text: 'Add photos, a description, and a price. Listings stay active for 60 days and can be relisted with one click.' },
  { icon: '🤝', title: 'Negotiate & accept', text: 'Receive offers from buyers, counter with your own price, and accept when it works for you.' },
  { icon: '🚚', title: 'Ship & update', text: 'Once paid, you get the buyer’s shipping address. Update the order status as you pack, ship, and deliver.' },
  { icon: '💰', title: 'Get paid', text: 'Tabende charges a simple 5% commission on completed sales. Boost your listing for $5 to feature it on the homepage for 7 days.' },
];

function Steps({ steps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {steps.map((s, i) => (
        <div key={s.title} className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg">{s.icon}</span>
            <span className="text-xs font-bold text-gray-400">STEP {i + 1}</span>
          </div>
          <h3 className="font-bold text-gray-900">{s.title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="section py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900">How Tabende Works</h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">A safe, simple marketplace for buying and selling locally. Here&rsquo;s everything you need to know.</p>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">🛍️ Buying</h2>
      <Steps steps={BUYER_STEPS} />

      <h2 className="text-lg font-bold text-gray-900 mb-4 mt-10">💼 Selling</h2>
      <Steps steps={SELLER_STEPS} />

      <div className="card p-6 mt-10">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Staying safe</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• <strong>Keep everything on Tabende</strong> — payments and messages on the platform are protected; deals taken off-platform are not.</li>
          <li>• <strong>Check seller profiles</strong> — ratings, reviews, and verified badges tell you who you&rsquo;re dealing with.</li>
          <li>• <strong>Report problems</strong> — every listing has a report button, every paid order can be disputed, and you can block any user from their profile.</li>
        </ul>
      </div>

      <div className="text-center mt-12">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/browse" className="btn-primary px-8 py-3.5 text-base rounded-2xl">Start Browsing</Link>
          <Link href="/register" className="btn-secondary px-8 py-3.5 text-base rounded-2xl">Create an Account</Link>
        </div>
      </div>
    </div>
  );
}
