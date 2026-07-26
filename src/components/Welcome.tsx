'use client';

interface Props { onStart: () => void }

export default function Welcome({ onStart }: Props) {
  return (
    <div style={{
      minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(29,185,84,.25) 0%, #121212 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center', fontFamily: 'Inter,sans-serif',
    }}>
      <div style={{ width: 88, height: 88, borderRadius: 20, background: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 28, boxShadow: '0 16px 48px rgba(29,185,84,.35)' }}>
        🎵
      </div>
      <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-1px' }}>
        Selamat Datang di mkmusic
      </h1>
      <p style={{ color: '#b3b3b3', fontSize: 16, maxWidth: 420, marginBottom: 36, lineHeight: 1.6 }}>
        Player musik pribadi ala Spotify & YT Music. Cari, putar, dan simpan lagu favoritmu tanpa iklan.
      </p>
      <button onClick={onStart} style={{
        background: '#1db954', color: '#000', border: 'none', borderRadius: 30, padding: '14px 40px',
        fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Mulai Dengarkan
      </button>
    </div>
  );
}
