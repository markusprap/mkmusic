'use client';

type Tab = 'home' | 'search' | 'discover' | 'library' | 'account';

interface Props {
  onTabChange: (t: Tab) => void;
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export default function TopBar({ onTabChange, onBack, onForward, canGoBack, canGoForward }: Props) {
  return (
    <header className="topbar">
      {/* Back/Forward Nav — real in-app history, not the browser's */}
      <div className="topbar-nav">
        <button className="topbar-nav-btn" disabled={!canGoBack} onClick={onBack} title="Kembali">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className="topbar-nav-btn" disabled={!canGoForward} onClick={onForward} title="Maju">
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
