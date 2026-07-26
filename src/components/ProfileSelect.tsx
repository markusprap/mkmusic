'use client';
import {
  Profile, PublicProfile,
  fetchPublicProfiles, createProfileRemote, unlockProfile, deleteProfileRemote,
  saveActiveId, loadActiveId,
} from '@/lib/store';
import { useState, useEffect } from 'react';

const COLORS = ['#1db954', '#e91e8c', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];
const AVATARS = ['🎵', '🎸', '🎹', '🎺', '🎻', '🥁'];
const MAX_PROFILES = 5;

interface Props { onSelect: (p: Profile) => void }

function PinBoxes({ value }: { value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 44, height: 44, borderRadius: 8,
          background: 'rgba(255,255,255,.08)',
          border: `1px solid ${value.length === i ? '#fff' : 'rgba(255,255,255,.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: '#fff',
        }}>
          {value[i] ? '•' : ''}
        </div>
      ))}
    </div>
  );
}

export default function ProfileSelect({ onSelect }: Props) {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<PublicProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublicProfile | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [formError, setFormError] = useState('');

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastActiveId = loadActiveId();

  function loadList() {
    setLoading(true);
    fetchPublicProfiles().then(list => { setProfiles(list); setLoading(false); });
  }
  useEffect(loadList, []);

  async function submitPin(value: string) {
    if (!unlockTarget || value.length !== 4 || busy) return;
    setBusy(true);
    const result = await unlockProfile(unlockTarget.id, value);
    setBusy(false);
    if ('error' in result) {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 500);
      return;
    }
    saveActiveId(unlockTarget.id);
    onSelect(result.profile);
  }

  async function handleCreate() {
    setFormError('');
    if (!name.trim()) return setFormError('Nama wajib diisi');
    if (!/^\d{4}$/.test(newPin)) return setFormError('PIN harus 4 digit angka');
    if (newPin !== confirmPin) return setFormError('Konfirmasi PIN tidak cocok');

    setBusy(true);
    const result = await createProfileRemote(name.trim(), color, avatar, newPin);
    setBusy(false);
    if ('error' in result) return setFormError(result.error);

    setCreating(false);
    setName(''); setNewPin(''); setConfirmPin('');
    loadList();
  }

  async function handleDelete(value: string) {
    if (!deleteTarget || value.length !== 4 || busy) return;
    setBusy(true);
    const ok = await deleteProfileRemote(deleteTarget.id, value);
    setBusy(false);
    if (!ok) { setPinError(true); setPin(''); setTimeout(() => setPinError(false), 500); return; }
    setDeleteTarget(null);
    setPin('');
    loadList();
  }

  // ── PIN entry screen (select or delete) ──
  const pinScreen = unlockTarget || deleteTarget;
  if (pinScreen) {
    const isDelete = !!deleteTarget;
    return (
      <div style={screenStyle}>
        <div style={{ width: 100, height: 100, borderRadius: 12, background: pinScreen.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 20 }}>
          {pinScreen.avatar}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          {isDelete ? `Hapus profil ${pinScreen.name}?` : `Masukkan PIN untuk ${pinScreen.name}`}
        </h1>
        <p style={{ color: '#b3b3b3', marginBottom: 28, fontSize: 14 }}>
          {isDelete ? 'Masukkan PIN profil ini untuk konfirmasi penghapusan' : 'PIN 4 digit'}
        </p>
        <div style={{ animation: pinError ? 'shake .4s' : undefined }}>
          <PinBoxes value={pin} />
        </div>
        <input type="tel" inputMode="numeric" maxLength={4} value={pin}
          autoFocus
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(v);
            if (v.length === 4) isDelete ? handleDelete(v) : submitPin(v);
          }} />
        {pinError && <p style={{ color: '#f44336', marginTop: 16, fontSize: 13 }}>PIN salah, coba lagi</p>}
        <button onClick={() => { setUnlockTarget(null); setDeleteTarget(null); setPin(''); }}
          style={{ marginTop: 28, background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Batal
        </button>
      </div>
    );
  }

  // ── Create profile screen ──
  if (creating) {
    return (
      <div style={screenStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Buat Profil Baru</h1>
        <div style={{ width: 100, height: 100, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 20 }}>
          {avatar}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)}
              style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, background: avatar === a ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.06)', border: avatar === a ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }}>
              {a}
            </button>
          ))}
        </div>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nama profil"
          style={inputStyle} />
        <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: color === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
          ))}
        </div>
        <input type="tel" inputMode="numeric" maxLength={4} value={newPin}
          onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="PIN 4 digit" style={{ ...inputStyle, marginBottom: 8 }} />
        <input type="tel" inputMode="numeric" maxLength={4} value={confirmPin}
          onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Konfirmasi PIN" style={inputStyle} />
        {formError && <p style={{ color: '#f44336', fontSize: 13, marginTop: 10 }}>{formError}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleCreate} disabled={busy} style={primaryBtn}>Buat Profil</button>
          <button onClick={() => setCreating(false)} style={outlineBtn}>Batal</button>
        </div>
      </div>
    );
  }

  // ── Profile grid ──
  return (
    <div style={screenStyle}>
      <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, marginBottom: 8, letterSpacing: '-1px', color: '#fff' }}>
        Siapa yang mendengarkan?
      </h1>
      <p style={{ color: '#b3b3b3', marginBottom: 48, fontSize: 16 }}>Pilih profil untuk melanjutkan</p>

      {!loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 32, maxWidth: 900 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 140, padding: '16px 8px', borderRadius: 12, position: 'relative' }}
              className="profile-tile">
              <div onClick={() => managing ? setDeleteTarget(p) : setUnlockTarget(p)}
                style={{ position: 'relative', cursor: 'pointer' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 12, background: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                  outline: lastActiveId === p.id ? '2px solid #fff' : 'none', outlineOffset: 3,
                  filter: managing ? 'brightness(.5)' : 'none',
                }}>
                  {p.avatar}
                </div>
                {managing && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" fill="none" stroke="#fff" strokeWidth="2" /></svg>
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: managing ? '#b3b3b3' : '#fff', textAlign: 'center' }}>{p.name}</span>
            </div>
          ))}

          {!managing && profiles.length < MAX_PROFILES && (
            <div onClick={() => setCreating(true)} className="profile-tile"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', width: 140, padding: '16px 8px', borderRadius: 12 }}>
              <div style={{ width: 100, height: 100, borderRadius: 12, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '2px dashed rgba(255,255,255,.2)' }}>
                +
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#b3b3b3' }}>Tambah Profil</span>
            </div>
          )}
        </div>
      )}

      {profiles.length > 0 && (
        <button onClick={() => setManaging(m => !m)} style={outlineBtn}>
          {managing ? 'Selesai' : 'Kelola Profil'}
        </button>
      )}

      <style jsx>{`
        .profile-tile:hover { background: rgba(255,255,255,.07); }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
      `}</style>
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#121212', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter,sans-serif', position: 'relative',
};

const inputStyle: React.CSSProperties = {
  width: 220, background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
  padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', textAlign: 'center',
};

const primaryBtn: React.CSSProperties = {
  background: '#1db954', color: '#000', border: 'none', borderRadius: 20, padding: '8px 18px',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};

const outlineBtn: React.CSSProperties = {
  background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.3)', borderRadius: 20,
  padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
};
