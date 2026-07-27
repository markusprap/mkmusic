'use client';
import { useState } from 'react';

interface Props {
  onJoin: (code: string) => Promise<string | void>;
  onClose: () => void;
}

export default function JoinRoomModal({ onJoin, onClose }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    const err = await onJoin(code);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)' }}
      onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} style={{
        width: 320, background: '#181818', borderRadius: 16, padding: 28,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)', fontFamily: 'Inter,sans-serif',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Gabung Room</h2>
        <p style={{ fontSize: 13, color: '#b3b3b3', marginBottom: 18, textAlign: 'center' }}>Masukkan kode 6 karakter dari yang buat Room</p>

        <input autoFocus value={code} maxLength={6}
          onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
          placeholder="KODE"
          style={{
            width: '100%', textAlign: 'center', letterSpacing: 6, fontSize: 22, fontWeight: 800,
            background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: '12px',
            color: '#fff', fontFamily: 'inherit', outline: 'none', marginBottom: 8,
          }} />
        {error && <p style={{ color: '#f44336', fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 12 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.25)', borderRadius: 24, padding: '12px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Batal
          </button>
          <button type="submit" disabled={code.length !== 6 || busy} style={{
            flex: 1, background: '#1db954', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: code.length !== 6 || busy ? .5 : 1,
          }}>
            Gabung
          </button>
        </div>
      </form>
    </div>
  );
}
