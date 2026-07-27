'use client';
import { Track, Profile, cacheTrack } from '@/lib/store';
import { useState, useEffect, useRef, useCallback } from 'react';
import TrackRow from './TrackRow';

interface AlbumData {
  id: string; name: string; artist: string; artistId?: string; year: number | null; thumbnail: string; tracks: Track[];
}

interface Props {
  albumId: string;
  profile: Profile;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: (t: Track, queue: Track[]) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  onOpenArtist: (id: string) => void;
  onBack: () => void;
}

export default function Album({ albumId, profile, currentTrack, isPlaying, onPlay, onProfileChange, onAddToQueue, onOpenArtist, onBack }: Props) {
  const [data, setData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedFor = useRef('');

  const fetchAlbum = useCallback(async (id: string) => {
    if (fetchedFor.current === id) return;
    fetchedFor.current = id;
    setLoading(true);
    try {
      const res = await fetch(`/api/album?id=${id}`);
      const json = await res.json();
      if (json.album) {
        json.album.tracks.forEach(cacheTrack);
        setData(json.album);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlbum(albumId); }, [albumId, fetchAlbum]);

  if (loading) {
    return (
      <div className="main-content-inner animate-in">
        <div className="page-header-gradient">
          <div className="skeleton" style={{ width: 160, height: 160, borderRadius: 8, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: 240, height: 32, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="main-content-inner animate-in">
        <div className="section">
          <button className="icon-btn" onClick={onBack} style={{ marginBottom: 16 }} title="Kembali">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '60px 0' }}>Gagal memuat album</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-inner animate-in">
      <div className="page-header-gradient">
        <div className="page-header-gradient-bg" style={{ background: 'linear-gradient(180deg,rgba(100,65,165,.35) 0%,#121212 100%)' }} />
        <button className="icon-btn" onClick={onBack} style={{ marginBottom: 16 }} title="Kembali">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {data.thumbnail && <img src={data.thumbnail} alt={data.name} style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'cover', boxShadow: '0 16px 48px rgba(0,0,0,.5)' }} />}
          <div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, marginBottom: 6 }}>{data.name}</h1>
            <p style={{ color: '#b3b3b3', fontSize: 14, cursor: data.artistId ? 'pointer' : 'default' }}
              onClick={() => data.artistId && onOpenArtist(data.artistId)}>
              {data.artist}{data.year ? ` · ${data.year}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="section">
        {data.tracks.length === 0 ? (
          <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '40px 0' }}>Album ini kosong</p>
        ) : (
          <div className="track-list">
            {data.tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} isActive={currentTrack?.id === t.id} isPlaying={isPlaying}
                profile={profile} onPlay={() => onPlay(t, data.tracks)} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
