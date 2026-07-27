'use client';
import { useState } from 'react';
import ModalShell from './ModalShell';

interface Props {
  code: string;
  onClose: () => void;
}

export default function RoomCreatedModal({ code, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function shareCode() {
    if (navigator.share) {
      navigator.share({ title: 'Gabung Room mkmusic', text: `Yuk gabung Room mkmusic aku, kodenya: ${code}` }).catch(() => {});
    } else {
      copyCode();
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Room Berhasil Dibuat!</h2>
      <p style={{ fontSize: 13, color: '#b3b3b3', marginBottom: 18, textAlign: 'center' }}>
        Bagikan kode ini ke profil lain di akun kamu buat gabung dengerin bareng
      </p>
      <div style={{
        fontSize: 32, fontWeight: 900, letterSpacing: 6, color: '#1db954',
        background: 'rgba(29,185,84,.1)', border: '2px dashed rgba(29,185,84,.4)',
        borderRadius: 12, padding: '16px 24px', marginBottom: 18, width: '100%', textAlign: 'center',
      }}>
        {code}
      </div>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button onClick={copyCode} style={{
          flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 24, padding: '12px',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {copied ? 'Tersalin!' : 'Salin Kode'}
        </button>
        <button onClick={shareCode} style={{
          flex: 1, background: '#1db954', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Bagikan
        </button>
      </div>
    </ModalShell>
  );
}
