'use client';
import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: 'Inter,sans-serif', zIndex: 9999, overflow: 'hidden' }}>
      <div className="splash-glow" />

      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity .7s ease' }}>
        <div className="splash-pulse">
          <img src="/logo.png" alt="mkmusic" style={{ width: 96, height: 96, display: 'block' }} />
        </div>
      </div>

      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity .7s ease .2s, transform .7s ease .2s',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>mkmusic</h1>
        <p style={{ fontSize: 13, color: '#727272', marginBottom: 20 }}>Muter musik gaya kamu</p>
        <div className="eq" style={{ justifyContent: 'center', height: 20 }}>
          <span style={{ width: 4 }} /><span style={{ width: 4 }} /><span style={{ width: 4 }} />
        </div>
      </div>

      <style jsx>{`
        .splash-glow {
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(29,185,84,.35) 0%, rgba(29,185,84,0) 70%);
          animation: splash-glow-pulse 2.6s ease-in-out infinite;
        }
        .splash-pulse {
          position: relative;
          animation: splash-breathe 2.6s ease-in-out infinite;
        }
        @keyframes splash-glow-pulse {
          0%, 100% { transform: scale(.9); opacity: .5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes splash-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
