'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { t as translate, DEFAULT_LOCALE, isValidLocale, LANGUAGES } from '@/lib/i18n';

export { LANGUAGES };

const I18nContext = createContext({
  lang: DEFAULT_LOCALE,
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LOCALE);
  const [overrides, setOverrides] = useState(null);
  const syncedFromAccount = useRef(false);

  // Load: localStorage first (fast), then the account preference (authoritative)
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && isValidLocale(saved)) setLangState(saved);

    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me?.language && isValidLocale(me.language) && !syncedFromAccount.current) {
          syncedFromAccount.current = true;
          setLangState(me.language);
          localStorage.setItem('lang', me.language);
        }
      })
      .catch(() => {});
  }, []);

  // Admin-managed overrides for the active locale (empty object when none)
  useEffect(() => {
    fetch(`/api/translations?locale=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOverrides(d?.overrides || null))
      .catch(() => setOverrides(null));
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!isValidLocale(code)) return;
    setLangState(code);
    localStorage.setItem('lang', code);
    // Persist per account when logged in (fire-and-forget)
    fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: code }),
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key, vars) => translate(key, lang, vars, overrides),
    [lang, overrides]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
