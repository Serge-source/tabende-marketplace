import en from '@/locales/en.json';
import nl from '@/locales/nl.json';
import es from '@/locales/es.json';
import pap from '@/locales/pap.json';

export const DEFAULT_LOCALE = 'pap';

export const LANGUAGES = {
  en: 'English',
  nl: 'Nederlands',
  es: 'Español',
  pap: 'Papiamento',
};

import { resolve } from './i18n-core.mjs';

const DICTIONARIES = { en, nl, es, pap };

/**
 * Translate a key for a locale. Resolution order:
 *   1. admin overrides (optional, from the Translation table)
 *   2. the locale's JSON file
 *   3. English (fallback for missing keys)
 *   4. the key itself (visible marker that a string is untranslated)
 * Supports {var} interpolation: t('x.y', 'pap', { name: 'Serge' })
 */
export function t(key, locale = DEFAULT_LOCALE, vars = null, overrides = null) {
  return resolve(key, locale, DICTIONARIES, 'en', vars, overrides);
}

export function getDictionary(locale) {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}

export function isValidLocale(locale) {
  return Object.prototype.hasOwnProperty.call(DICTIONARIES, locale);
}
