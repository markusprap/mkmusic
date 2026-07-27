'use client';
import { useState } from 'react';
import { Profile } from '@/lib/store';
import { Room } from '@/lib/rooms';
import { isBackgroundModeEnabled, toggleBackgroundMode } from '@/lib/backgroundMode';
import pkg from '../../package.json';

interface Props {
  profile: Profile;
  activeRoom: Room | null;
  onSwitchProfile: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onShowCredits: () => void;
  onSignOut: () => void;
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  width: '100%', padding: '14px 16px', borderRadius: 10,
  background: 'rgba(255,255,255,.06)', fontSize: 14, fontWeight: 600,
  color: '#fff', cursor: 'pointer', textAlign: 'left', border: 'none', fontFamily: 'inherit',
};

export default function Account({ profile, activeRoom, onSwitchProfile, onCreateRoom, onJoinRoom, onLeaveRoom, onShowCredits, onSignOut }: Props) {
  const [bgMode] = useState(() => isBackgroundModeEnabled());

  return (
    <div className="main-content-inner animate-in" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Akun</h1>

      {/* Profile */}
      <div className="profile-card" style={{ background: 'rgba(255,255,255,.06)', padding: 14 }} onClick={onSwitchProfile}>
        <div className="profile-avatar" style={{ background: profile.color, width: 48, height: 48, fontSize: 20 }}>{profile.avatar}</div>
        <div className="profile-info">
          <div className="profile-name" style={{ fontSize: 16, fontWeight: 700 }}>{profile.name}</div>
          <div className="profile-sub">Ganti profil</div>
        </div>
      </div>

      {/* Room */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="lib-section-title" style={{ padding: '0 4px' }}>Dengarkan Bareng</div>
        {activeRoom ? (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>ROOM AKTIF</span>
              <button onClick={onLeaveRoom} style={{ background: 'none', border: 'none', color: '#f44336', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Keluar
              </button>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: '#fff', margin: '6px 0' }}>{activeRoom.code}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {activeRoom.members.map(m => (
                <div key={m.id} title={m.name} style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                  {m.avatar}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...rowStyle, flex: 1, justifyContent: 'center' }} onClick={onCreateRoom}>Buat Room</button>
            <button style={{ ...rowStyle, flex: 1, justifyContent: 'center' }} onClick={onJoinRoom}>Gabung Room</button>
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="lib-section-title" style={{ padding: '0 4px' }}>Pengaturan</div>
        <button style={rowStyle} onClick={toggleBackgroundMode}>
          <span>Mode Latar Belakang (Beta)</span>
          <span style={{ color: bgMode ? '#1db954' : 'var(--text-2)', fontWeight: 700 }}>{bgMode ? 'ON' : 'OFF'}</span>
        </button>
        <button style={rowStyle} onClick={onShowCredits}>Credits & Donasi</button>
        <button style={{ ...rowStyle, color: '#f44336' }} onClick={onSignOut}>Keluar Akun</button>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, marginTop: 8 }}>
        mkmusic v{pkg.version}
      </div>
    </div>
  );
}
