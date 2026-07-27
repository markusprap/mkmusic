'use client';

type Tab = 'home' | 'search' | 'discover' | 'library' | 'account';

interface Props { onTabChange: (t: Tab) => void }

export default function TopBar({ onTabChange }: Props) {
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

      {/* Right actions */}
      <div className="topbar-right">
        <button className="icon-btn" title="Jelajahi" onClick={() => onTabChange('discover')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
