'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ModalShell from './ModalShell';
import PasswordInput from './PasswordInput';

interface Props { onClose: () => void }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: '12px 14px',
  color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
};

export default function AccountSettingsModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setName(data.user?.user_metadata?.name || '');
      setEmail(data.user?.email || '');
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    const supabase = createClient();
    const update: { email?: string; password?: string; data?: { name: string } } = { data: { name } };
    if (email) update.email = email;
    if (password) update.password = password;
    const { error } = await supabase.auth.updateUser(update);
    setBusy(false);
    if (error) return setError(error.message);
    setPassword('');
    setSuccess('Perubahan disimpan. Cek email kamu jika alamat email diganti.');
  }

  return (
    <ModalShell onClose={onClose} onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Pengaturan Akun</h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Nama" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <PasswordInput placeholder="Password baru (opsional)" value={password} onChange={setPassword} />
        {success && <p style={{ color: '#1db954', fontSize: 13 }}>{success}</p>}
        {error && <p style={{ color: '#f44336', fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={busy} style={{
          background: '#1db954', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%', marginTop: 8,
        }}>
          Simpan
        </button>
        <button type="button" onClick={onClose} style={{ color: '#b3b3b3', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Batal
        </button>
      </div>
    </ModalShell>
  );
}
