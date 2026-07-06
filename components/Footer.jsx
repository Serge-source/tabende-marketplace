'use client';
import Link from 'next/link';
import { useT } from './I18nProvider';

export default function Footer() {
  const t = useT();
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="section py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-extrabold text-gray-900">Ta Bende Bon</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">{t('footer.marketplace')}</h4>
            <ul className="space-y-2">
              {[[t('footer.browseListings'), '/browse'], [t('footer.sellAnItem'), '/listings/new'], [t('footer.howItWorks'), '/how-it-works']].map(([l, h]) => (
                <li key={l}><Link href={h} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">{t('footer.account')}</h4>
            <ul className="space-y-2">
              {[[t('footer.signUp'), '/register'], [t('nav.logIn'), '/login'], [t('nav.dashboard'), '/dashboard'], [t('nav.messages'), '/messages']].map(([l, h]) => (
                <li key={l}><Link href={h} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">{t('footer.support')}</h4>
            <ul className="space-y-2">
              {[[t('footer.helpCenter'), '/support'], [t('auth.terms'), '/terms'], [t('auth.privacy'), '/privacy'], [t('footer.contactUs'), '/support']].map(([l, h]) => (
                <li key={l}><Link href={h} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Ta Bende Bon. {t('footer.rights')}</p>
          <p className="text-xs text-gray-400">{t('footer.payments')}</p>
        </div>
      </div>
    </footer>
  );
}
