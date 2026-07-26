'use client';

type Tab = 'home' | 'search' | 'discover' | 'library';

interface Props { activeTab: Tab; onChange: (t: Tab) => void }

const ITEMS: { id: Tab; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    id: 'home', label: 'Beranda',
    icon: (a) => <svg width="22" height="22" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'search', label: 'Cari',
    icon: (a) => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={a?'2.5':'2'} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    id: 'discover', label: 'Jelajahi',
    icon: (a) => <svg width="22" height="22" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/></svg>,
  },
  {
    id: 'library', label: 'Koleksi',
    icon: (a) => <svg width="22" height="22" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  },
];

export default function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {ITEMS.map(item => (
          <button key={item.id} className={`bnav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}>
            {item.icon(activeTab === item.id)}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
