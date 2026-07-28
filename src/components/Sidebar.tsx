'use client';
import { useState } from 'react';
import { Profile, Track, getTrack } from '@/lib/store';
import { Room } from '@/lib/rooms';
import { isBackgroundModeEnabled, toggleBackgroundMode } from '@/lib/backgroundMode';

type Tab = 'home' | 'search' | 'discover' | 'library' | 'account';

interface Props {
  profile: Profile;
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onPlay: (t: Track, queue: Track[]) => void;
  queue: Track[];
  currentTrack: Track | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSwitchProfile: () => void;
  onShowCredits: () => void;
  onSignOut: () => void;
  activeRoom: Room | null;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
}

export default function Sidebar({ profile, activeTab, onTabChange, onPlay, queue, currentTrack, sidebarCollapsed, onToggleSidebar, onSwitchProfile, onShowCredits, onSignOut, activeRoom, onCreateRoom, onJoinRoom, onLeaveRoom }: Props) {
  const [bgMode] = useState(() => isBackgroundModeEnabled());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const recentIds = profile?.recentIds || [];
  const likedIds = profile?.likedIds || [];
  const playlists = profile?.playlists || [];

  const recentTracks = recentIds.slice(0, 8).map(id => getTrack(id)).filter(Boolean) as Track[];
  const liked = getTrack;

  const navItems: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'home', label: 'Beranda',
      icon: <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/></svg>,
    },
    {
      id: 'search', label: 'Cari',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    },
    {
      id: 'discover', label: 'Jelajahi',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/></svg>,
    },
    {
      id: 'library', label: 'Koleksi',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    },
  ];

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <button onClick={onToggleSidebar} className="logo-icon" aria-label="Toggle sidebar">
          <svg width="20" height="20" fill="none" stroke="#1db954" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="logo-text" style={{color:'#1db954'}}>mkmusic</span>
      </div>

      {/* Nav Items */}
      <div className="sidebar-nav">
        {navItems.map(item => (
          <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)} title={item.label}>
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* Library */}
      <div className="sidebar-library">
        {/* Liked Songs */}
        <div className="lib-section-title">Koleksi</div>
        <div className="lib-item" onClick={() => onTabChange('library')}>
          <div style={{width:40,height:40,borderRadius:4,background:'linear-gradient(135deg,#450af5,#c4efd9)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div className="lib-item-info">
            <div className="lib-item-name">Lagu Disukai</div>
            <div className="lib-item-sub">{likedIds.length} lagu</div>
          </div>
        </div>

        {/* User Playlists */}
        {playlists.map(pl => (
          <div key={pl.id} className="lib-item">
            <div style={{width:40,height:40,borderRadius:4,background:'#282828',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="18" height="18" fill="none" stroke="#b3b3b3" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="lib-item-info">
              <div className="lib-item-name">{pl.name}</div>
              <div className="lib-item-sub">{pl.trackIds.length} lagu</div>
            </div>
          </div>
        ))}

        {/* Recent tracks */}
        {recentTracks.length > 0 && (
          <>
            <div className="lib-section-title">Riwayat</div>
            {recentTracks.map(t => (
              <div key={t.id} className="lib-item" onClick={()=>onPlay(t, recentTracks)}>
                <img src={t.thumbnail} alt={t.title} style={{width:40,height:40,borderRadius:4,objectFit:'cover',flexShrink:0}} />
                <div className="lib-item-info">
                  <div className="lib-item-name">{t.title}</div>
                  <div className="lib-item-sub">{t.artist}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Room */}
      <div className="sidebar-bottom" style={{paddingBottom: 0}}>
        {activeRoom ? (
          <div style={{background:'rgba(255,255,255,.06)', borderRadius:8, padding:'10px 12px', marginBottom:8}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span style={{fontSize:11, color:'var(--text-2)', fontWeight:600}}>ROOM AKTIF</span>
              <button onClick={onLeaveRoom} style={{background:'none', border:'none', color:'#f44336', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit'}}>
                Keluar
              </button>
            </div>
            <div style={{fontSize:18, fontWeight:800, letterSpacing:2, color:'#fff', margin:'4px 0'}}>{activeRoom.code}</div>
            <div style={{display:'flex', gap:4}}>
              {activeRoom.members.map(m => (
                <img key={m.id} title={m.name} src={m.avatar} alt={m.name} style={{width:24, height:24, borderRadius:'50%'}} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <button className="lib-item" style={{...bottomBtnStyle, flex:1}} onClick={onCreateRoom}>
              Buat Room
            </button>
            <button className="lib-item" style={{...bottomBtnStyle, flex:1}} onClick={onJoinRoom}>
              Gabung Room
            </button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="sidebar-bottom">
        <div className="profile-card" onClick={onSwitchProfile}>
          <img className="profile-avatar" src={profile.avatar} alt={profile.name} />
          <div className="profile-info">
            <div className="profile-name">{profile.name}</div>
            <div className="profile-sub">Ganti profil</div>
          </div>
        </div>
        <div style={{position:'relative'}}>
          <button className="lib-item" style={{...bottomBtnStyle, display:'flex', gap:8}} onClick={() => setSettingsOpen(o => !o)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Pengaturan
          </button>
          {settingsOpen && (
            <>
              <div style={{position:'fixed', inset:0, zIndex:399}} onClick={() => setSettingsOpen(false)} />
              <div className="ctx-menu" style={{position:'absolute', bottom:'calc(100% + 4px)', left:0, right:0, width:'auto'}}>
                <div className="ctx-item" style={{justifyContent:'space-between'}} onClick={toggleBackgroundMode}>
                  <span>Mode Latar Belakang (Beta)</span>
                  <span style={{color: bgMode ? '#1db954' : 'var(--text-2)', fontWeight:700}}>{bgMode ? 'ON' : 'OFF'}</span>
                </div>
                <div className="ctx-item" onClick={() => { setSettingsOpen(false); onShowCredits(); }}>
                  Credits & Donasi
                </div>
                <div className="ctx-divider" />
                <div className="ctx-item" style={{color:'#f44336'}} onClick={() => { setSettingsOpen(false); onSignOut(); }}>
                  Keluar Akun
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const bottomBtnStyle: React.CSSProperties = {
  width: '100%', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, justifyContent: 'center',
};
