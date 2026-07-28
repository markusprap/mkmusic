'use client';
import { Track, Profile, cacheTrack, toggleLike, formatDuration } from '@/lib/store';
import type { ArtistResult, AlbumResult, PlaylistResult } from '@/lib/youtube';
import { useState, useEffect, useRef, useCallback } from 'react';
import TrackMenu from './TrackMenu';
import TrackImg from './TrackImg';

type SearchTab = 'songs' | 'artists' | 'albums' | 'playlists';

const CATEGORIES = [
  { name: 'Pop', color: '#e91e8c', query: 'pop hits' },
  { name: 'Hip-Hop', color: '#ff6f00', query: 'hip hop' },
  { name: 'Electronic', color: '#6200ea', query: 'electronic dance' },
  { name: 'R&B', color: '#c62828', query: 'r&b soul' },
  { name: 'Rock', color: '#1565c0', query: 'rock music' },
  { name: 'Indie', color: '#2e7d32', query: 'indie alternative' },
  { name: 'Jazz', color: '#4e342e', query: 'jazz' },
  { name: 'K-Pop', color: '#ad1457', query: 'kpop' },
  { name: 'Indonesia', color: '#b71c1c', query: 'lagu indonesia' },
  { name: 'Klasik', color: '#263238', query: 'classical music' },
  { name: 'Religi', color: '#f57f17', query: 'musik religi islami' },
  { name: 'Dangdut', color: '#d84315', query: 'dangdut koplo' },
];

interface Props {
  query: string;
  profile: Profile;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: (t: Track, queue: Track[]) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  onCategoryClick: (q: string) => void;
  onQueryChange: (q: string) => void;
  onOpenArtist: (id: string) => void;
  onOpenAlbum: (id: string) => void;
}

export default function Search({ query, profile, currentTrack, isPlaying, onPlay, onProfileChange, onCategoryClick, onQueryChange, onAddToQueue, onOpenArtist, onOpenAlbum }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [albums, setAlbums] = useState<AlbumResult[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('songs');
  const [visibleCount, setVisibleCount] = useState(20);
  const lastQuery = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onQueryChange(''); inputRef.current?.blur(); }
  }

  const searchInput = (
    <div style={{ padding: '20px 24px 0' }}>
      <div className="topbar-search-wrap" style={{ maxWidth: '100%' }}>
        <svg width="18" height="18" fill="none" stroke="#b3b3b3" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input ref={inputRef} className="topbar-search-input" type="text" placeholder="Cari lagu, artis, album..."
          value={query} onChange={e => onQueryChange(e.target.value)} onKeyDown={handleKey} autoFocus />
        {query && (
          <button onClick={() => onQueryChange('')} className="icon-btn" style={{ padding: 0 }}>
            <svg width="16" height="16" fill="none" stroke="#b3b3b3" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q === lastQuery.current) return;
    lastQuery.current = q;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const t: Track[] = data.tracks ?? [];
      t.forEach(cacheTrack);
      setTracks(t);
      setVisibleCount(20);
      setArtists(data.artists ?? []);
      setAlbums(data.albums ?? []);
      setPlaylists(data.playlists ?? []);
    } catch {
      setTracks([]); setArtists([]); setAlbums([]); setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (query) doSearch(query); }, [query, doSearch]);

  const loadMore = useCallback(() => {
    setVisibleCount(c => Math.min(c + 20, tracks.length));
  }, [tracks.length]);

  // Mobile-only: .loadmore-sentinel is display:none on desktop (CSS,
  // >768px), so it never intersects there — desktop stays button-only.
  useEffect(() => {
    if (!sentinel) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [sentinel, loadMore]);

  const liked = (id: string) => (profile?.likedIds || []).includes(id);

  function handleLike(e: React.MouseEvent, track: Track) {
    e.stopPropagation();
    onProfileChange(toggleLike(profile, track.id));
  }


  // No query — show categories
  if (!query) {
    return (
      <div className="main-content-inner animate-in">
        {searchInput}
        <div style={{padding:'24px 24px 16px'}}>
          <h2 className="section-title" style={{marginBottom:20}}>Jelajahi Semua</h2>
        </div>
        <div className="section">
          <div className="search-categories">
            {CATEGORIES.map(c => (
              <div key={c.name} className="search-category-card"
                style={{background:`linear-gradient(135deg,${c.color}dd,${c.color}66)`}}
                onClick={() => onCategoryClick(c.query)}>
                <span className="search-category-label">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topResult = tracks[0];
  const TABS: { id: SearchTab; label: string; count: number }[] = [
    { id: 'songs', label: 'Lagu', count: tracks.length },
    { id: 'artists', label: 'Artis', count: artists.length },
    { id: 'albums', label: 'Album', count: albums.length },
    { id: 'playlists', label: 'Playlist', count: playlists.length },
  ];

  return (
    <div className="main-content-inner animate-in">
      {searchInput}
      <div style={{padding:'16px 24px 0'}}>
        <p style={{color:'#b3b3b3',fontSize:13,marginBottom:16}}>Hasil untuk: <strong style={{color:'#fff'}}>"{query}"</strong></p>
      </div>

      {/* Hero top result */}
      {!loading && topResult && (
        <div className="section">
          <h2 className="section-title" style={{marginBottom:12}}>Hasil Teratas</h2>
          <div className="search-hero-card" onClick={() => onPlay(topResult, tracks)}>
            <TrackImg className="search-hero-img" src={topResult.thumbnail} alt={topResult.title} />
            <div>
              <p style={{fontSize:13,color:'#b3b3b3',marginBottom:4}}>Lagu</p>
              <h3 style={{fontSize:'clamp(18px,3vw,26px)',fontWeight:900,marginBottom:4}}>{topResult.title}</h3>
              <p style={{color:'#b3b3b3',fontSize:14}}>{topResult.artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{padding:'0 24px'}}>
        <div className="search-result-tabs">
          {TABS.filter(t => loading || t.count > 0 || t.id === 'songs').map(tab => (
            <button key={tab.id} className={`search-tab ${activeTab===tab.id?'active':''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="section">
          {Array(6).fill(0).map((_,i) => (
            <div key={i} style={{display:'flex',gap:12,padding:'8px 0',alignItems:'center'}}>
              <div className="skeleton" style={{width:40,height:40,borderRadius:4,flexShrink:0}} />
              <div style={{flex:1}}>
                <div className="skeleton" style={{height:14,marginBottom:6,borderRadius:3}} />
                <div className="skeleton" style={{height:12,width:'60%',borderRadius:3}} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Songs list */}
      {!loading && activeTab === 'songs' && (
        <div className="section">
          <div className="track-list">
            {tracks.slice(0, visibleCount).map((t, i) => {
              const isActive = currentTrack?.id === t.id;
              return (
                <div key={t.id} className={`track-row ${isActive ? 'is-active' : ''}`}
                  onClick={() => onPlay(t, tracks)}>
                  <div className="track-num-cell">{isActive && isPlaying ? <div className="eq"><span/><span/><span/></div> : i+1}</div>
                  <div className="track-play-icon">
                    <svg width="14" height="14" fill={isActive?'#1db954':'currentColor'} viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                  <div className="track-info">
                    <TrackImg className="track-img" src={t.thumbnail} alt={t.title} />
                    <div className="track-meta">
                      <div className="track-title">{t.title}</div>
                      <div className="track-artist">{t.artist}</div>
                    </div>
                  </div>
                  <button className={`track-like icon-btn ${liked(t.id)?'liked active':''}`} onClick={e=>handleLike(e,t)}>
                    <svg width="16" height="16" fill={liked(t.id)?'currentColor':'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <TrackMenu className="track-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
                  <div className="track-dur">{formatDuration(t.duration)}</div>
                </div>
              );
            })}
          </div>
          {tracks.length === 0 && (
            <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 0'}}>Tidak ada hasil untuk "{query}"</p>
          )}
          {visibleCount < tracks.length && (
            <>
              <div className="loadmore-row">
                <button className="btn-outline" onClick={loadMore}>
                  Muat Lebih Banyak
                </button>
              </div>
              <div ref={setSentinel} className="loadmore-sentinel" />
            </>
          )}
        </div>
      )}

      {/* Artists — real searchArtists results */}
      {!loading && activeTab === 'artists' && (
        <div className="section">
          <div className="card-grid">
            {artists.map(a => (
              <div key={a.id} className="card" onClick={() => onOpenArtist(a.id)}>
                <div className="card-img-wrap circle">
                  <TrackImg src={a.thumbnail} alt={a.name} />
                  <div className="card-play">
                    <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
                <div className="card-title" style={{textAlign:'center'}}>{a.name}</div>
                <div className="card-sub" style={{textAlign:'center'}}>Artis</div>
              </div>
            ))}
          </div>
          {artists.length === 0 && <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 0'}}>Tidak ada artis ditemukan</p>}
        </div>
      )}

      {/* Albums — real searchAlbums results */}
      {!loading && activeTab === 'albums' && (
        <div className="section">
          <div className="card-grid">
            {albums.map(a => (
              <div key={a.id} className="card" onClick={() => onOpenAlbum(a.id)}>
                <div className="card-img-wrap">
                  <TrackImg src={a.thumbnail} alt={a.name} />
                  <div className="card-play">
                    <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
                <div className="card-title">{a.name}</div>
                <div className="card-sub">{a.artist}{a.year ? ` · ${a.year}` : ''}</div>
              </div>
            ))}
          </div>
          {albums.length === 0 && <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 0'}}>Tidak ada album ditemukan</p>}
        </div>
      )}

      {/* Playlists — real searchPlaylists results */}
      {!loading && activeTab === 'playlists' && (
        <div className="section">
          <div className="card-grid">
            {playlists.map(p => (
              <div key={p.id} className="card" onClick={() => onCategoryClick(p.name)}>
                <div className="card-img-wrap">
                  <TrackImg src={p.thumbnail} alt={p.name} />
                  <div className="card-play">
                    <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
                <div className="card-title">{p.name}</div>
                <div className="card-sub">{p.artist || 'Playlist'}</div>
              </div>
            ))}
          </div>
          {playlists.length === 0 && <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 0'}}>Tidak ada playlist ditemukan</p>}
        </div>
      )}
    </div>
  );
}
