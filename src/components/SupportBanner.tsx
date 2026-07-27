'use client';
import { useEffect, useState } from 'react';
import ModalShell from './ModalShell';

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
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { if (shouldShow()) setShow(true); }, 4000);
    return () => clearTimeout(t);
  }, []);

  // Low-rating thank-you closes itself; the Trakteer screen waits for a click.
  useEffect(() => {
    if (submitted && rating < 4) {
      const t = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(t);
    }
  }, [submitted, rating]);

  if (!show) return null;

  async function submitFeedback() {
    setBusy(true);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    }).catch(() => {});
    setBusy(false);
    setSubmitted(true);
  }

  return (
    <ModalShell onClose={() => setShow(false)}>
      {!submitted ? (
        <>
          <p style={{ color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
            Gimana pengalaman kamu pakai mkmusic sejauh ini?
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: rating ? 16 : 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
                <svg width="30" height="30" viewBox="0 0 24 24"
                  fill={n <= (hoverRating || rating) ? '#ffd600' : 'none'}
                  stroke={n <= (hoverRating || rating) ? '#ffd600' : '#727272'} strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Ada masukan buat mkmusic? (opsional)" rows={3}
                style={{
                  width: '100%', background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
                  padding: '10px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  resize: 'none', marginBottom: 14,
                }} />
              <button onClick={submitFeedback} disabled={busy} style={{
                width: '100%', background: '#1db954', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Kirim
              </button>
            </>
          )}
          {rating === 0 && (
            <button onClick={() => setShow(false)} style={{ marginTop: 16, background: 'none', border: 'none', color: '#727272', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Nanti aja
            </button>
          )}
        </>
      ) : rating >= 4 ? (
        <>
          <p style={{ color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 18, lineHeight: 1.6 }}>
            Makasih banyak! 🎉 Seneng banget kalau mkmusic ngebantu kamu. Kalau berkenan, boleh banget traktir kopi ke developer-nya biar mkmusic terus bisa dikembangin.
          </p>
          <a href="https://teer.id/programmergenz" target="_blank" rel="noopener noreferrer" onClick={() => setShow(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#ffd600', color: '#000',
              fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 24, width: '100%', marginBottom: 10,
            }}>
            ☕ Dukung di Trakteer
          </a>
          <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#727272', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Nanti aja
          </button>
        </>
      ) : (
        <p style={{ color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 1.6 }}>
          Makasih atas masukannya 🙏 Bakal jadi bahan buat mkmusic makin baik ke depannya.
        </p>
      )}
    </ModalShell>
  );
}
