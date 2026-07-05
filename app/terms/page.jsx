import Link from 'next/link';

export const metadata = { title: 'Terms of Service — Tabende' };

const EFFECTIVE_DATE = 'June 26, 2026';

export default function TermsPage() {
  return (
    <div className="section py-12 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Effective date: {EFFECTIVE_DATE}</p>

      <div className="prose-sm space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Agreement to Terms</h2>
          <p>By creating an account or using Tabende (&quot;the Platform&quot;), you agree to these Terms of Service. If you do not agree, do not use the Platform. We may update these terms; continued use after changes constitutes acceptance. We will notify registered users of material changes by email or in-app notice.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. The Service</h2>
          <p>Tabende is a marketplace that connects buyers and sellers. Tabende is not a party to transactions between users. We do not own, inspect, or guarantee any items listed. Sellers are solely responsible for their listings, item condition, accuracy of descriptions, and fulfillment. Buyers are responsible for evaluating listings before purchasing.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Accounts</h2>
          <p>You must be at least 18 years old to use the Platform. You are responsible for maintaining the security of your account credentials and for all activity under your account. You must provide accurate registration information. We may suspend or terminate accounts that violate these terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Prohibited Items and Conduct</h2>
          <p>You may not list or sell: illegal items, weapons, drugs, counterfeit or stolen goods, recalled products, hazardous materials, adult content, live animals, or items that infringe intellectual property rights. You may not: harass other users, manipulate reviews, create fake listings, attempt to complete transactions outside the Platform to avoid fees, use automated tools to scrape the Platform, or misrepresent your identity.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Fees and Payments</h2>
          <p>Payments are processed by Stripe. Tabende charges sellers a commission of 5% on completed sales, deducted automatically from the sale amount. Optional listing promotions (such as boosts) are charged at the price displayed at purchase time. Fees are non-refundable except where required by law.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Shipping, Returns, and Disputes</h2>
          <p>Sellers must ship items promptly and update the order status accurately. If a dispute arises between buyer and seller, both parties should first attempt to resolve it through the Platform&apos;s messaging system. Unresolved issues may be reported to Tabende support, and we may — at our discretion — mediate, but we are not obligated to issue refunds on behalf of sellers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Content</h2>
          <p>You retain ownership of content you post (listings, photos, reviews, messages) but grant Tabende a worldwide, non-exclusive, royalty-free license to use, display, and distribute it for operating and promoting the Platform. You must have the right to post any content you upload. We may remove content that violates these terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. Disclaimers and Limitation of Liability</h2>
          <p>The Platform is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, Tabende is not liable for indirect, incidental, or consequential damages, or for losses arising from transactions between users. Our total liability for any claim is limited to the fees you paid to Tabende in the twelve months preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">9. Termination</h2>
          <p>You may close your account at any time by contacting support. We may suspend or terminate your access for violations of these terms, fraudulent activity, or legal requirements. Sections 7–10 survive termination.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contact</h2>
          <p>Questions about these terms: <Link href="/support" className="text-blue-600 hover:underline">contact support</Link>.</p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">This document is a general template and does not constitute legal advice. Have it reviewed by a qualified attorney in your operating jurisdiction before relying on it.</p>
      </div>
    </div>
  );
}
