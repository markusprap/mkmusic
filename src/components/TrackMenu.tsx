'use client';
import { Profile, Track, createPlaylist, addToPlaylist, toggleLike } from '@/lib/store';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import NamePromptModal from './NamePromptModal';

interface Props {
  profile: Profile;
  track: Track;
  onProfileChange: (p: Profile) => void;
  onAddToQueue?: (t: Track) => void;
  // All optional — each only renders a menu item when the caller actually
  // wires it up, same pattern as onAddToQueue already used. Most call sites
  // (Home cards, Search rows, ...) won't pass these; the expanded player's
  // now-playing menu does.
  onStartMix?: (t: Track) => void;
  onPlayNext?: (t: Track) => void;
  onOpenArtist?: (id: string) => void;
  onDismissQueue?: () => void;
  className?: string;
}

export default function TrackMenu({ profile, track, onProfileChange, onAddToQueue, onStartMix, onPlayNext, onOpenArtist, onDismissQueue, className }: Props) {
  const [open, setOpen] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  // Positioned against the viewport (getBoundingClientRect) and rendered
  // through a portal straight into document.body — needed for two separate
  // reasons: (1) this button lives inside horizontally-scrolling rows
  // (Pilihan Cepat, Baru Diputar, ...) whose overflow-x:auto also clips the
  // Y axis, so a CSS-relative dropdown rendered below the button was
  // invisible; (2) Home's outer wrapper has a fade-in animation that ends
  // on `transform:translateY(0)` — any non-none transform on an ancestor
  // makes it the containing block for position:fixed descendants instead
  // of the real viewport, which put the dropdown's getBoundingClientRect
  // math against the wrong box entirely. Portaling to body sidesteps both.
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  }

  function addTo(playlistId: string) {
    onProfileChange(addToPlaylist(profile, playlistId, track.id));
    setOpen(false);
  }

  function addToQueue() {
    onAddToQueue?.(track);
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

  const liked = (profile?.likedIds || []).includes(track.id);
  function handleLike() {
    onProfileChange(toggleLike(profile, track.id));
    setOpen(false);
  }

  function handleStartMix() { onStartMix?.(track); setOpen(false); }
  function handlePlayNext() { onPlayNext?.(track); setOpen(false); }
  function handleOpenArtist() { if (track.artistId) onOpenArtist?.(track.artistId); setOpen(false); }
  function handleDismissQueue() { onDismissQueue?.(); setOpen(false); }

  // Native share sheet where available, clipboard copy as the fallback —
  // no backend endpoint of our own to build a "share link" against, so this
  // just shares/copies the track's own YouTube URL.
  function handleShare() {
    const url = `https://music.youtube.com/watch?v=${track.id}`;
    if (navigator.share) navigator.share({ title: track.title, text: track.artist, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).catch(() => {});
    setOpen(false);
  }

  return (
    <div className={`track-menu-anchor ${className ?? ''}`} onClick={e => e.stopPropagation()}>
      <button ref={btnRef} className="icon-btn" onClick={toggleOpen} title="Tambah ke playlist">
        {className?.includes('card-menu') ? (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        )}
      </button>
      {open && menuPos && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setOpen(false)} />
          <div className="ctx-menu" style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, left: 'auto' }}>
            {onStartMix && <div className="ctx-item" onClick={handleStartMix}>Mulai Mix</div>}
            {onPlayNext && <div className="ctx-item" onClick={handlePlayNext}>Putar Berikutnya</div>}
            {onAddToQueue && <div className="ctx-item" onClick={addToQueue}>Tambahkan ke Antrian</div>}
            <div className="ctx-item" onClick={handleLike}>{liked ? 'Hapus dari Lagu Disukai' : 'Tambah ke Lagu Disukai'}</div>
            <div className="ctx-divider" />
            <div className="ctx-item" style={{ opacity: .6, cursor: 'default' }}>Tambah ke playlist</div>
            {(profile?.playlists || []).map(pl => (
              <div key={pl.id} className="ctx-item" onClick={() => addTo(pl.id)}>{pl.name}</div>
            ))}
            <div className="ctx-item" onClick={createNew}>+ Playlist Baru</div>
            {(onOpenArtist || onDismissQueue) && <div className="ctx-divider" />}
            {onOpenArtist && track.artistId && <div className="ctx-item" onClick={handleOpenArtist}>Ke Artis</div>}
            <div className="ctx-item" onClick={handleShare}>Bagikan</div>
            {onDismissQueue && <div className="ctx-item" onClick={handleDismissQueue}>Kosongkan Antrian</div>}
          </div>
        </>,
        document.body
      )}
      {showCreatePlaylist && (
        <NamePromptModal title="Playlist Baru" placeholder="Nama playlist"
          onSubmit={submitCreatePlaylist} onClose={() => setShowCreatePlaylist(false)} />
      )}
    </div>
  );
}
