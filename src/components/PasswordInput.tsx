'use client';
import { useState } from 'react';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: '12px 14px',
  color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
};

interface Props {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

export default function PasswordInput({ placeholder, value, onChange, required }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={visible ? 'text' : 'password'} required={required} minLength={6} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: 40 }} />
      <button type="button" onClick={() => setVisible(v => !v)} tabIndex={-1}
        style={{ position: 'absolute', right: 10, top: 0, bottom: 0, background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        {visible ? (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </button>
    </div>
  );
}
