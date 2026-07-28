'use client';
import { useState } from 'react';
import { Profile } from '@/lib/store';
import { Room } from '@/lib/rooms';
import { isBackgroundModeEnabled, toggleBackgroundMode } from '@/lib/backgroundMode';
import AccountSettingsModal from './AccountSettingsModal';
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

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span style={{
      width: 40, height: 24, borderRadius: 12, padding: 2, flexShrink: 0,
      background: on ? '#1db954' : 'rgba(255,255,255,.2)', transition: 'background .15s',
      display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'block' }} />
    </span>
  );
}

export default function Account({ profile, activeRoom, onSwitchProfile, onCreateRoom, onJoinRoom, onLeaveRoom, onShowCredits, onSignOut }: Props) {
  const [bgMode] = useState(() => isBackgroundModeEnabled());
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  return (
    <div className="main-content-inner animate-in" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Akun</h1>

      {/* Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <img src={profile.avatar} alt={profile.name} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>{profile.name}</div>
        <button onClick={onSwitchProfile} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 4 }}>
          Ganti profil
        </button>
      </div>

      {/* Room */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="lib-section-title" style={{ padding: '0 4px' }}>Dengarkan Bareng</div>
        {activeRoom ? (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>ROOM AKTIF</span>
              <button onClick={onLeaveRoom} style={{ background: 'none', border: 'none', color: '#f44336', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Keluar
              </button>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4, color: '#1db954', textAlign: 'center', margin: '10px 0' }}>{activeRoom.code}</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {activeRoom.members.map(m => (
                <img key={m.id} title={m.name} src={m.avatar} alt={m.name} style={{ width: 26, height: 26, borderRadius: '50%' }} />
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
          <ToggleSwitch on={bgMode} />
        </button>
        <button style={rowStyle} onClick={() => setShowAccountSettings(true)}>Pengaturan Akun</button>
        <button style={rowStyle} onClick={onShowCredits}>Credit Developer</button>
        <button style={{ ...rowStyle, color: '#f44336' }} onClick={onSignOut}>Keluar Akun</button>
      </div>

      {/* Donasi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="lib-section-title" style={{ padding: '0 4px' }}>Donasi</div>
        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: '#b3b3b3', lineHeight: 1.5, margin: 0 }}>
            Suka pakai mkmusic? Boleh banget traktir kopi ke developer-nya biar mkmusic terus bisa dikembangin.
          </p>
          <a href="https://teer.id/programmergenz" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#ffd600', color: '#000',
            fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 24, width: '100%',
          }}>
            ☕ Dukung di Trakteer
          </a>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, marginTop: 8 }}>
        mkmusic v{pkg.version}
      </div>

      {showAccountSettings && <AccountSettingsModal onClose={() => setShowAccountSettings(false)} />}
    </div>
  );
}
