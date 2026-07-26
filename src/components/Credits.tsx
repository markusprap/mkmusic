'use client';

interface Props { onClose: () => void }

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/markusprap', icon: (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55v-1.94c-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15v3.19c0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
  )},
  { label: 'Instagram', href: 'https://www.instagram.com/markusprap/', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37a4 4 0 1 1-7.914 1.174A4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  )},
  { label: 'X', href: 'https://x.com/markusprap21', icon: (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L.7 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L6.4 3.9H4.6L17.7 20z"/></svg>
  )},
  { label: 'Threads', href: 'https://www.threads.com/@markusprap', icon: (
    <img src="/250px-Threads_(app)_logo.svg.webp" alt="Threads" width={18} height={18} style={{ filter: 'invert(1)' }} />
  )},
];

export default function Credits({ onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 340, background: '#181818', borderRadius: 16, padding: 28,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)', fontFamily: 'Inter,sans-serif',
      }}>
        <img src="/foto-profile.jpeg" alt="Markus Prap Kurniawan" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Markus Prap Kurniawan</h2>
        <p style={{ fontSize: 13, color: '#b3b3b3', marginBottom: 16 }}>Developer mkmusic</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {LINKS.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" title={l.label}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {l.icon}
            </a>
          ))}
        </div>

        <a href="https://teer.id/programmergenz" target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#ffd600', color: '#000',
            fontWeight: 700, fontSize: 14, padding: '10px 24px', borderRadius: 24, width: '100%',
            justifyContent: 'center', marginBottom: 12,
          }}>
          ☕ Dukung di Trakteer
        </a>

        <button onClick={onClose} style={{ color: '#b3b3b3', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Tutup
        </button>
      </div>
    </div>
  );
}
