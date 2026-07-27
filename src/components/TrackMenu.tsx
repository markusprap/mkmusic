'use client';
import { Profile, Track, createPlaylist, addToPlaylist } from '@/lib/store';
import { useState } from 'react';
import NamePromptModal from './NamePromptModal';

interface Props {
  profile: Profile;
  track: Track;
  onProfileChange: (p: Profile) => void;
  className?: string;
}

export default function TrackMenu({ profile, track, onProfileChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  function addTo(playlistId: string) {
    onProfileChange(addToPlaylist(profile, playlistId, track.id));
    setOpen(false);
  }

  function createNew() {
    setOpen(false);
    setShowCreatePlaylist(true);
  }

  function submitCreatePlaylist(name: string) {
    const { profile: withPlaylist, playlist } = createPlaylist(profile, name);
    onProfileChange(addToPlaylist(withPlaylist, playlist.id, track.id));
    setShowCreatePlaylist(false);
  }

  return (
    <div className={`track-menu-anchor ${className ?? ''}`} onClick={e => e.stopPropagation()}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)} title="Tambah ke playlist">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setOpen(false)} />
          <div className="ctx-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, left: 'auto' }}>
            <div className="ctx-item" style={{ opacity: .6, cursor: 'default' }}>Tambah ke playlist</div>
            {(profile?.playlists || []).map(pl => (
              <div key={pl.id} className="ctx-item" onClick={() => addTo(pl.id)}>{pl.name}</div>
            ))}
            <div className="ctx-divider" />
            <div className="ctx-item" onClick={createNew}>+ Playlist Baru</div>
          </div>
        </>
      )}
      {showCreatePlaylist && (
        <NamePromptModal title="Playlist Baru" placeholder="Nama playlist"
          onSubmit={submitCreatePlaylist} onClose={() => setShowCreatePlaylist(false)} />
      )}
    </div>
  );
}
