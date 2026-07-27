'use client';
import { Track, Profile, cacheTrack } from '@/lib/store';
import { useState, useEffect, useRef, useCallback } from 'react';
import TrackRow from './TrackRow';

interface Release { id: string; name: string; year: number | null; thumbnail: string }
interface RelatedItem { id: string; name: string; thumbnail: string }
interface ArtistData {
  id: string; name: string; thumbnail: string;
  topSongs: Track[]; topAlbums: Release[]; topSingles: Release[];
  featuredOn: RelatedItem[]; similarArtists: RelatedItem[];
}

interface Props {
  artistId: string;
  profile: Profile;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: (t: Track, queue: Track[]) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  onOpenArtist: (id: string) => void;
  onOpenAlbum: (id: string) => void;
  onBack: () => void;
}

export default function Artist({ artistId, profile, currentTrack, isPlaying, onPlay, onProfileChange, onAddToQueue, onOpenArtist, onOpenAlbum, onBack }: Props) {
  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedFor = useRef('');

  const fetchArtist = useCallback(async (id: string) => {
    if (fetchedFor.current === id) return;
    fetchedFor.current = id;
    setLoading(true);
    try {
      const res = await fetch(`/api/artist?id=${id}`);
      const json = await res.json();
      if (json.artist) {
        json.artist.topSongs.forEach(cacheTrack);
        setData(json.artist);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArtist(artistId); }, [artistId, fetchArtist]);

  if (loading) {
    return (
      <div className="main-content-inner animate-in">
        <div className="page-header-gradient">
          <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%', marginBottom: 16 }} />
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
          <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '60px 0' }}>Gagal memuat artis</p>
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
        {data.thumbnail && (
          <img src={data.thumbnail} alt={data.name} style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', marginBottom: 16, boxShadow: '0 16px 48px rgba(0,0,0,.5)' }} />
        )}
        <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, marginBottom: 6 }}>{data.name}</h1>
      </div>

      {data.topSongs.length > 0 && (
        <div className="section">
          <div className="section-header"><h2 className="section-title">Lagu Populer</h2></div>
          <div className="track-list">
            {data.topSongs.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} isActive={currentTrack?.id === t.id} isPlaying={isPlaying}
                profile={profile} onPlay={() => onPlay(t, data.topSongs)} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
            ))}
          </div>
        </div>
      )}

      {data.topAlbums.length > 0 && (
        <div className="section">
          <div className="section-header"><h2 className="section-title">Album</h2></div>
          <div className="scroll-row" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {data.topAlbums.map(a => (
              <div key={a.id} className="card" style={{ width: 160, flexShrink: 0 }} onClick={() => onOpenAlbum(a.id)}>
                <div className="card-img-wrap"><img src={a.thumbnail} alt={a.name} /></div>
                <div className="card-title">{a.name}</div>
                <div className="card-sub">{a.year ?? 'Album'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topSingles.length > 0 && (
        <div className="section">
          <div className="section-header"><h2 className="section-title">Single</h2></div>
          <div className="scroll-row" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {data.topSingles.map(a => (
              <div key={a.id} className="card" style={{ width: 160, flexShrink: 0 }} onClick={() => onOpenAlbum(a.id)}>
                <div className="card-img-wrap"><img src={a.thumbnail} alt={a.name} /></div>
                <div className="card-title">{a.name}</div>
                <div className="card-sub">{a.year ?? 'Single'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.similarArtists.length > 0 && (
        <div className="section">
          <div className="section-header"><h2 className="section-title">Artis Serupa</h2></div>
          <div className="scroll-row" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {data.similarArtists.map(a => (
              <div key={a.id} className="card" style={{ width: 140, flexShrink: 0 }} onClick={() => onOpenArtist(a.id)}>
                <div className="card-img-wrap circle"><img src={a.thumbnail} alt={a.name} /></div>
                <div className="card-title" style={{ textAlign: 'center' }}>{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
