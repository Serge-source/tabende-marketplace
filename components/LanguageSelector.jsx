'use client';
import { useI18n, LANGUAGES } from '@/components/I18nProvider';

export default function LanguageSelector({ className = '' }) {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      aria-label="Language"
      className={`text-xs font-medium text-gray-600 bg-transparent border border-gray-200 rounded-xl px-2 py-1.5 cursor-pointer focus:outline-none dark:text-gray-300 dark:border-gray-700 ${className}`}
    >
      {Object.entries(LANGUAGES).map(([code, label]) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
}
