'use client';
import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <img src="/logo.png" alt="mkmusic" style={{
        width: 96, height: 96,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(.85)',
        transition: 'opacity .5s ease, transform .5s ease',
      }} />
    </div>
  );
}
