'use client';
import { useEffect, useState } from 'react';

const KEY = 'mkmusic_support_banner';

// Up to 3 times a day, spaced at least 2 hours apart — so reloading the page
// repeatedly doesn't spam it back-to-back.
function shouldShow(): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : { date: today, count: 0, lastShown: 0 };
    if (state.date !== today) { state.date = today; state.count = 0; }
    const hoursSinceLast = (Date.now() - (state.lastShown || 0)) / 3600000;
    if (state.count >= 3 || hoursSinceLast < 2) return false;
    state.count += 1;
    state.lastShown = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export default function SupportBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { if (shouldShow()) setShow(true); }, 4000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)', zIndex: 450,
      width: 'min(340px,92vw)', background: '#181818', borderRadius: 16, padding: '20px 20px 18px',
      boxShadow: '0 24px 64px rgba(0,0,0,.6)', fontFamily: 'Inter,sans-serif', animation: 'slideUp .3s ease',
    }}>
      <button onClick={() => setShow(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#727272', cursor: 'pointer' }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <p style={{ color: '#fff', fontSize: 14, marginBottom: 14, lineHeight: 1.5, paddingRight: 16 }}>
        Apakah mkmusic bermanfaat buat kamu? Kalau iya, kamu bisa support developer dengan traktir dia kopi supaya webapp ini bisa terus update.
      </p>
      <a href="https://teer.id/programmergenz" target="_blank" rel="noopener noreferrer" onClick={() => setShow(false)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#ffd600', color: '#000', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 24 }}>
        ☕ Dukung di Trakteer
      </a>
    </div>
  );
}
