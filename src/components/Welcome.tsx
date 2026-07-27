'use client';
import { useState } from 'react';

interface Props { onStart: () => void }

const SLIDES = [
  {
    image: '/slide1.png',
    title: 'Profil buat Semua Orang',
    desc: 'Buat sampai 5 profil dalam satu akun, masing-masing dengan PIN sendiri — persis kayak Netflix.',
  },
  {
    image: '/slide2.png',
    title: 'Dengerin Bareng-Bareng',
    desc: 'Buat Room dan ajak profil lain di akun kamu — semua orang dengar lagu yang sama, bisa play/pause/skip bareng secara real-time.',
  },
  {
    image: '/slide3.png',
    title: '100% Bebas Iklan',
    desc: 'Nggak ada iklan, nggak ada banner, nggak ada gangguan. Musik diputar bersih, kapan pun kamu mau.',
  },
];

export default function Welcome({ onStart }: Props) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center', fontFamily: 'Inter,sans-serif',
    }}>
      <img src="/logo.png" alt="mkmusic" style={{ width: 56, height: 56, marginBottom: 24 }} />

      <img src={slide.image} alt={slide.title} style={{ width: 'min(320px,80vw)', marginBottom: 28 }} />

      <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-1px' }}>
        {slide.title}
      </h1>
      <p style={{ color: '#b3b3b3', fontSize: 15, maxWidth: 400, marginBottom: 24, lineHeight: 1.6 }}>
        {slide.desc}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? '#1db954' : 'rgba(255,255,255,.25)', transition: 'width .2s' }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, width: 'min(320px,80vw)' }}>
        {!isLast && (
          <button onClick={onStart} style={{
            flex: 1, background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.25)', borderRadius: 30, padding: '14px',
            fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Lewati
          </button>
        )}
        <button onClick={() => isLast ? onStart() : setStep(s => s + 1)} style={{
          flex: isLast ? undefined : 1, width: isLast ? '100%' : undefined,
          background: '#1db954', color: '#000', border: 'none', borderRadius: 30, padding: '14px',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {isLast ? 'Mulai Dengarkan' : 'Lanjut'}
        </button>
      </div>
    </div>
  );
}
