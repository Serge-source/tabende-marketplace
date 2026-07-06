import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — Ta Bende Bon' };

const EFFECTIVE_DATE = 'June 26, 2026';

export default function PrivacyPage() {
  return (
    <div className="section py-12 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Effective date: {EFFECTIVE_DATE}</p>

      <div className="prose-sm space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. What We Collect</h2>
          <p><strong>Account data:</strong> name, email address, password (stored hashed), optional profile photo and bio.</p>
          <p><strong>Transaction data:</strong> listings you create, orders you place or receive, reviews, and messages sent through the Platform. Payment card details are processed by Pay.aw and never stored on our servers.</p>
          <p><strong>Technical data:</strong> IP address, browser type, and usage events collected via Google Analytics to understand how the Platform is used.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use It</h2>
          <p>We use your data to: operate the marketplace (matching buyers and sellers, processing orders), send transactional emails (order confirmations, shipping updates, security notices), prevent fraud and abuse, improve the Platform through aggregated analytics, and comply with legal obligations. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Sharing</h2>
          <p>We share data only with: <strong>other users</strong> as needed to complete transactions (your name and profile are visible to people you transact or message with), <strong>service providers</strong> that operate the Platform on our behalf (Pay.aw for payments, SendGrid for email, Railway for hosting, Google Analytics for usage measurement), and <strong>authorities</strong> when legally required.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Cookies</h2>
          <p>We use a strictly necessary session cookie to keep you logged in, and Google Analytics cookies to measure usage. You can block analytics cookies in your browser settings without affecting core functionality.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Retention</h2>
          <p>We keep your account data while your account is active. Transaction records are retained as required for financial and legal compliance. Messages are retained while both accounts exist. You may request deletion of your account and associated personal data (see Your Rights below); financial records we are legally required to keep are retained in anonymized form.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Your Rights</h2>
          <p>Depending on your jurisdiction (including under GDPR), you have the right to: access the personal data we hold about you, correct inaccurate data, request deletion, receive a copy of your data in a portable format, and object to certain processing. To exercise any of these rights, <Link href="/support" className="text-blue-600 hover:underline">contact support</Link>. We respond within 30 days.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Security</h2>
          <p>Passwords are hashed with bcrypt, connections are encrypted with TLS, payment processing is delegated to Pay.aw, and optional two-factor authentication is available on all accounts. No system is perfectly secure; notify us immediately if you suspect unauthorized access to your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. Children</h2>
          <p>The Platform is not directed at children under 18, and we do not knowingly collect data from them.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">9. Changes and Contact</h2>
          <p>We will notify registered users of material changes to this policy by email or in-app notice. Questions: <Link href="/support" className="text-blue-600 hover:underline">contact support</Link>.</p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">This document is a general template and does not constitute legal advice. Have it reviewed by a qualified attorney in your operating jurisdiction before relying on it.</p>
      </div>
    </div>
  );
}
