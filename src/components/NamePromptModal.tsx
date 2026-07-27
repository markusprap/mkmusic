'use client';
import { useState } from 'react';
import ModalShell from './ModalShell';

interface Props {
  title: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export default function NamePromptModal({ title, placeholder, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  }

  return (
    <ModalShell onClose={onClose} onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 18 }}>{title}</h2>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', textAlign: 'center', fontSize: 15,
          background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: '12px',
          color: '#fff', fontFamily: 'inherit', outline: 'none', marginBottom: 8,
        }} />
      <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 12 }}>
        <button type="button" onClick={onClose} style={{
          flex: 1, background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.25)', borderRadius: 24, padding: '12px',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Batal
        </button>
        <button type="submit" disabled={!name.trim()} style={{
          flex: 1, background: '#1db954', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: name.trim() ? 1 : .5,
        }}>
          Buat
        </button>
      </div>
    </ModalShell>
  );
}
