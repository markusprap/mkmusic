'use client';
import {
  Profile, PublicProfile,
  fetchPublicProfiles, createProfileRemote, unlockProfile, deleteProfileRemote, syncProfile,
  saveActiveId, loadActiveId, normalizeProfile,
} from '@/lib/store';
import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import Onboarding from './Onboarding';

const AVATARS = [
  '/avatar/cranks.svg', '/avatar/cranks-1.svg', '/avatar/cranks-2.svg',
  '/avatar/delivery-boy.svg', '/avatar/delivery-boy-1.svg', '/avatar/delivery-boy-2.svg',
  '/avatar/delivery-boy-3.svg', '/avatar/delivery-boy-4.svg', '/avatar/delivery-boy-5.svg',
  '/avatar/e-commerce.svg', '/avatar/e-commerce-1.svg', '/avatar/e-commerce-2.svg',
];
const MAX_PROFILES = 5;

interface Props { onSelect: (p: Profile) => void }

function AvatarPicker({ avatar, setAvatar }: { avatar: string; setAvatar: (a: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 16, maxWidth: 260 }}>
      {AVATARS.map(a => (
        <button key={a} onClick={() => setAvatar(a)}
          style={{ width: 38, height: 38, borderRadius: '50%', padding: 2, background: avatar === a ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.06)', border: avatar === a ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }}>
          <img src={a} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        </button>
      ))}
    </div>
  );
}

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
  const [editTarget, setEditTarget] = useState<PublicProfile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editPinVerified, setEditPinVerified] = useState('');
  const [onboardingProfile, setOnboardingProfile] = useState<Profile | null>(null);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [formError, setFormError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const result = await createProfileRemote(name.trim(), avatar, newPin);
    setBusy(false);
    if ('error' in result) return setFormError(result.error);

    setCreating(false);
    setName(''); setNewPin(''); setConfirmPin('');
    setOnboardingProfile(normalizeProfile(result.profile));
  }

  // Verifies the PIN once, then unlocks the edit screen for that profile —
  // both saving changes and deleting reuse this already-verified PIN so the
  // user isn't asked to type it twice.
  async function submitEditPin(value: string) {
    if (!editTarget || value.length !== 4 || busy) return;
    setBusy(true);
    const result = await unlockProfile(editTarget.id, value);
    setBusy(false);
    if ('error' in result) {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 500);
      return;
    }
    setEditProfile(result.profile);
    setEditPinVerified(value);
    setName(result.profile.name);
    setAvatar(result.profile.avatar);
    setPin('');
  }

  async function handleSaveEdit() {
    if (!editProfile) return;
    setFormError('');
    if (!name.trim()) return setFormError('Nama wajib diisi');
    if (newPin && (!/^\d{4}$/.test(newPin) || newPin !== confirmPin)) {
      return setFormError('PIN baru harus 4 digit dan cocok dengan konfirmasi');
    }
    setBusy(true);
    const ok = await syncProfile({ ...editProfile, name: name.trim(), avatar });
    setBusy(false);
    if (!ok) return setFormError('Gagal menyimpan');
    if (newPin) {
      const res = await fetch(`/api/profiles/${editProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: editPinVerified, newPin }),
      });
      if (!res.ok) { setFormError('Gagal ganti PIN'); return; }
    }
    closeEdit();
    loadList();
  }

  async function handleDeleteFromEdit() {
    if (!editTarget) return;
    setBusy(true);
    const ok = await deleteProfileRemote(editTarget.id, editPinVerified);
    setBusy(false);
    if (!ok) return setFormError('Gagal menghapus');
    closeEdit();
    loadList();
  }

  function closeEdit() {
    setEditTarget(null);
    setEditProfile(null);
    setEditPinVerified('');
    setName(''); setNewPin(''); setConfirmPin(''); setFormError('');
  }

  // ── Onboarding (fresh profile only, right after creation) ──
  if (onboardingProfile) {
    return (
      <Onboarding profile={onboardingProfile} onDone={p => {
        setOnboardingProfile(null);
        saveActiveId(p.id);
        onSelect(p);
      }} />
    );
  }

  // ── PIN entry screen (select or edit) ──
  const pinScreen = unlockTarget || (editTarget && !editProfile ? editTarget : null);
  if (pinScreen) {
    const isEdit = !!editTarget;
    return (
      <div style={screenStyle}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', marginBottom: 20 }}>
          <img src={pinScreen.avatar} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          {isEdit ? `Kelola profil ${pinScreen.name}` : `Masukkan PIN untuk ${pinScreen.name}`}
        </h1>
        <p style={{ color: '#b3b3b3', marginBottom: 28, fontSize: 14 }}>PIN 4 digit</p>
        <div style={{ animation: pinError ? 'shake .4s' : undefined }}>
          <PinBoxes value={pin} />
        </div>
        <input type="tel" inputMode="numeric" maxLength={4} value={pin}
          autoFocus
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(v);
            if (v.length === 4) isEdit ? submitEditPin(v) : submitPin(v);
          }} />
        {pinError && <p style={{ color: '#f44336', marginTop: 16, fontSize: 13 }}>PIN salah, coba lagi</p>}
        <button onClick={() => { setUnlockTarget(null); setEditTarget(null); setPin(''); }}
          style={{ marginTop: 28, background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Batal
        </button>
      </div>
    );
  }

  // ── Edit profile screen ──
  if (editProfile) {
    return (
      <div style={screenStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Edit Profil</h1>
        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', marginBottom: 20 }}>
          <img src={avatar} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <AvatarPicker avatar={avatar} setAvatar={setAvatar} />
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nama profil"
          style={{ ...inputStyle, marginBottom: 14 }} />
        <p style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6 }}>Ganti PIN (opsional)</p>
        <input type="tel" inputMode="numeric" maxLength={4} value={newPin}
          onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="PIN baru" style={{ ...inputStyle, marginBottom: 8 }} />
        <input type="tel" inputMode="numeric" maxLength={4} value={confirmPin}
          onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Konfirmasi PIN baru" style={inputStyle} />
        {formError && <p style={{ color: '#f44336', fontSize: 13, marginTop: 10 }}>{formError}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleSaveEdit} disabled={busy} style={primaryBtn}>Simpan</button>
          <button onClick={closeEdit} style={outlineBtn}>Batal</button>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)} disabled={busy}
          style={{ ...outlineBtn, color: '#f44336', borderColor: 'rgba(244,67,54,.4)' }}>
          Hapus Profil
        </button>
        {showDeleteConfirm && editTarget && (
          <ConfirmModal
            message={`Hapus profil ${editTarget.name}? Semua playlist & lagu disukai ikut terhapus.`}
            confirmLabel="Hapus" danger
            onConfirm={handleDeleteFromEdit}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    );
  }

  // ── Create profile screen ──
  if (creating) {
    return (
      <div style={screenStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Buat Profil Baru</h1>
        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', marginBottom: 20 }}>
          <img src={avatar} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <AvatarPicker avatar={avatar} setAvatar={setAvatar} />
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nama profil"
          style={{ ...inputStyle, marginBottom: 14 }} />
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

      {loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 32, maxWidth: 900 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 140, padding: '16px 8px' }}>
              <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 32, maxWidth: 900 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 140, padding: '16px 8px', borderRadius: 12, position: 'relative' }}
              className="profile-tile">
              <div onClick={() => managing ? setEditTarget(p) : setUnlockTarget(p)}
                style={{ position: 'relative', cursor: 'pointer' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                  outline: lastActiveId === p.id ? '2px solid #fff' : 'none', outlineOffset: 3,
                  filter: managing ? 'brightness(.5)' : 'none',
                }}>
                  <img src={p.avatar} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
                {managing && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: managing ? '#b3b3b3' : '#fff', textAlign: 'center' }}>{p.name}</span>
            </div>
          ))}

          {!managing && profiles.length < MAX_PROFILES && (
            <div onClick={() => setCreating(true)} className="profile-tile"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', width: 140, padding: '16px 8px', borderRadius: 12 }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '2px dashed rgba(255,255,255,.2)' }}>
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

export const screenStyle: React.CSSProperties = {
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
