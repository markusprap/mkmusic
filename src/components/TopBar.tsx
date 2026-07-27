'use client';
import { useRef, useState } from 'react';
import { Profile } from '@/lib/store';
import { Room } from '@/lib/rooms';

type Tab = 'home' | 'search' | 'discover' | 'library';

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  profile: Profile;
  onSwitchProfile: () => void;
  onShowCredits: () => void;
  onSignOut: () => void;
  activeRoom: Room | null;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
}

export default function TopBar({ activeTab, onTabChange, searchQuery, onSearchChange, onSearchSubmit, profile, onSwitchProfile, onShowCredits, onSignOut, activeRoom, onCreateRoom, onJoinRoom, onLeaveRoom }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onSearchSubmit();
    if (e.key === 'Escape') { onSearchChange(''); inputRef.current?.blur(); }
  }

  return (
    <header className="topbar">
      {/* Back/Forward Nav */}
      <div className="topbar-nav">
        <button className="topbar-nav-btn" onClick={() => history.back()} title="Kembali">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className="topbar-nav-btn" onClick={() => history.forward()} title="Maju">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="topbar-search-wrap" onClick={() => { onTabChange('search'); inputRef.current?.focus(); }}>
        <svg width="18" height="18" fill="none" stroke="#b3b3b3" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input ref={inputRef} className="topbar-search-input" type="text" placeholder="Cari lagu, artis, album..."
          value={searchQuery} onChange={e => { onSearchChange(e.target.value); onTabChange('search'); }}
          onKeyDown={handleKey} />
        {searchQuery && (
          <button onClick={e => { e.stopPropagation(); onSearchChange(''); }} className="icon-btn" style={{padding:0}}>
            <svg width="16" height="16" fill="none" stroke="#b3b3b3" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Right actions */}
      <div className="topbar-right">
        <button className="icon-btn" title="Jelajahi" onClick={() => onTabChange('discover')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
          </svg>
        </button>
        <div className="topbar-profile-btn" style={{position:'relative'}}>
          <button onClick={() => setShowMenu(m => !m)} title={profile.name}
            style={{width:32,height:32,borderRadius:'50%',background:profile.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
            {profile.avatar}
          </button>
          {showMenu && (
            <>
              <div style={{position:'fixed',inset:0,zIndex:399}} onClick={() => setShowMenu(false)} />
              <div className="ctx-menu" style={{position:'absolute',top:'calc(100% + 8px)',right:0,left:'auto'}}>
                {activeRoom ? (
                  <div className="ctx-item" onClick={() => { setShowMenu(false); onLeaveRoom(); }}>Keluar Room ({activeRoom.code})</div>
                ) : (
                  <>
                    <div className="ctx-item" onClick={() => { setShowMenu(false); onCreateRoom(); }}>Buat Room</div>
                    <div className="ctx-item" onClick={() => { setShowMenu(false); onJoinRoom(); }}>Gabung Room</div>
                  </>
                )}
                <div className="ctx-item" onClick={() => { setShowMenu(false); onSwitchProfile(); }}>Ganti Profil</div>
                <div className="ctx-item" onClick={() => { setShowMenu(false); onShowCredits(); }}>Credits & Donasi</div>
                <div className="ctx-item" onClick={() => { setShowMenu(false); onSignOut(); }}>Keluar Akun</div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
