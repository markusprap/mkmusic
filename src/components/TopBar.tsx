'use client';
import { useRef } from 'react';

type Tab = 'home' | 'search' | 'discover' | 'library';

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
}

export default function TopBar({ activeTab, onTabChange, searchQuery, onSearchChange, onSearchSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

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
        <div className="supabase-badge" title="Supabase Connected">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#3ecf8e"><path d="M21.362 9.354H12V.301L2.638 14.646H12v9.053l9.362-14.345z"/></svg>
          <span className="supabase-badge-text">Supabase Active</span>
        </div>
        <button className="icon-btn" title="Jelajahi" onClick={() => onTabChange('discover')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
