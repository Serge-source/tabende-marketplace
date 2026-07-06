'use client';
import { useEffect } from 'react';

export default function ServiceWorker() {
  useEffect(() => {
    // NEXT_PUBLIC_DISABLE_SW=1 keeps e2e/CI browsers deterministic
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DISABLE_SW !== '1') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
