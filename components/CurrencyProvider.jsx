'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Prices are stored in Aruban florin (the platform standard).
// USD uses the official 1.79 peg; EUR is an approximate market rate.
export const CURRENCIES = {
  AWG: { symbol: 'Afl.', label: 'Afl. (Aruba)', rate: 1 },
  USD: { symbol: 'U$', label: 'U$ (USA)', rate: 1 / 1.79 },
  EUR: { symbol: '€', label: '€ (Euro)', rate: 1 / 1.95 },
};

const CurrencyContext = createContext({
  currency: 'AWG',
  setCurrency: () => {},
  format: (n) => `Afl. ${n}`,
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('AWG');
  const [rates, setRates] = useState({ USD: CURRENCIES.USD.rate, EUR: CURRENCIES.EUR.rate });

  useEffect(() => {
    const saved = localStorage.getItem('currency');
    if (saved && CURRENCIES[saved]) setCurrencyState(saved);
    // Validate conversion rates against the live feed (EUR floats; USD is
    // pegged and the server sanity-checks the feed against the peg)
    fetch('/api/currency/rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.USD && d?.EUR) setRates({ USD: d.USD, EUR: d.EUR });
      })
      .catch(() => {});
  }, []);

  const setCurrency = (code) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    localStorage.setItem('currency', code);
  };

  const format = useCallback((amount) => {
    const c = CURRENCIES[currency];
    const rate = currency === 'AWG' ? 1 : rates[currency] ?? c.rate;
    const converted = amount * rate;
    const digits = converted % 1 === 0 ? 0 : 2;
    return `${c.symbol} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: 2,
    })}`;
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
