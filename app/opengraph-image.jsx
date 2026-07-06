import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Tabende Marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fbff, #eef6ff)', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', width: 120, height: 120, background: '#2563eb', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#102033' }}>Tabende</div>
        <div style={{ display: 'flex', fontSize: 32, color: '#5c6b7a', marginTop: 16 }}>
          Buy &amp; sell locally — find great deals near you
        </div>
      </div>
    ),
    size
  );
}
