'use client';
import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Inter,sans-serif', zIndex: 9999 }}>
      <img src="/logo.png" alt="mkmusic" style={{
        width: 96, height: 96,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(.85)',
        transition: 'opacity .5s ease, transform .5s ease',
      }} />
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity .5s ease .15s, transform .5s ease .15s',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>mkmusic</h1>
        <p style={{ fontSize: 13, color: '#727272' }}>Muter musik gaya kamu</p>
      </div>
    </div>
  );
}
