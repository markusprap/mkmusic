'use client';
import { Track, Profile, cacheTrack, toggleLike } from '@/lib/store';
import { useState, useEffect, useRef, useCallback } from 'react';
import TrackMenu from './TrackMenu';

type SearchTab = 'songs' | 'albums' | 'artists';

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
  onCategoryClick: (q: string) => void;
}

export default function Search({ query, profile, currentTrack, isPlaying, onPlay, onProfileChange, onCategoryClick }: Props) {
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('songs');
  const lastQuery = useRef('');

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q === lastQuery.current) return;
    lastQuery.current = q;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const tracks: Track[] = data.tracks ?? [];
      tracks.forEach(cacheTrack);
      setResults(tracks);
    } catch { setResults([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (query) doSearch(query); }, [query, doSearch]);

  const liked = (id: string) => (profile?.likedIds || []).includes(id);

  function handleLike(e: React.MouseEvent, track: Track) {
    e.stopPropagation();
    onProfileChange(toggleLike(profile, track.id));
  }

  function formatDur(s: number) {
    if (!s) return '–';
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // No query — show categories
  if (!query) {
    return (
      <div className="main-content-inner animate-in">
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

  const topResult = results[0];

  return (
    <div className="main-content-inner animate-in">
      <div style={{padding:'24px 24px 0'}}>
        <p style={{color:'#b3b3b3',fontSize:13,marginBottom:16}}>Hasil untuk: <strong style={{color:'#fff'}}>"{query}"</strong></p>
      </div>

      {/* Hero top result */}
      {!loading && topResult && (
        <div className="section">
          <h2 className="section-title" style={{marginBottom:12}}>Hasil Teratas</h2>
          <div className="search-hero-card" onClick={() => onPlay(topResult, results)}>
            <img className="search-hero-img" src={topResult.thumbnail} alt={topResult.title} />
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
          {(['songs','albums','artists'] as SearchTab[]).map(tab => (
            <button key={tab} className={`search-tab ${activeTab===tab?'active':''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'songs' ? 'Lagu' : tab === 'albums' ? 'Album' : 'Artis'}
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
            {results.map((t, i) => {
              const isActive = currentTrack?.id === t.id;
              return (
                <div key={t.id} className={`track-row ${isActive ? 'is-active' : ''}`}
                  onClick={() => onPlay(t, results)}>
                  <div className="track-num-cell">{isActive && isPlaying ? <div className="eq"><span/><span/><span/></div> : i+1}</div>
                  <div className="track-play-icon">
                    <svg width="14" height="14" fill={isActive?'#1db954':'currentColor'} viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                  <div className="track-info">
                    <img className="track-img" src={t.thumbnail} alt={t.title} />
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
                  <TrackMenu className="track-menu" profile={profile} track={t} onProfileChange={onProfileChange} />
                  <div className="track-dur">{formatDur(t.duration)}</div>
                </div>
              );
            })}
          </div>
          {!loading && results.length === 0 && (
            <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 0'}}>Tidak ada hasil untuk "{query}"</p>
          )}
        </div>
      )}

      {/* Artists — derived from song artist names */}
      {!loading && activeTab === 'artists' && (
        <div className="section">
          <div className="card-grid">
            {[...new Map(results.map(t => [t.artist, t])).values()].slice(0,12).map(t => (
              <div key={t.artist} className="card" onClick={() => onCategoryClick(t.artist)}>
                <div className="card-img-wrap circle">
                  <img src={t.thumbnail} alt={t.artist} />
                  <div className="card-play">
                    <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
                <div className="card-title" style={{textAlign:'center'}}>{t.artist}</div>
                <div className="card-sub" style={{textAlign:'center'}}>Artis</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Albums — group by artist as proxy */}
      {!loading && activeTab === 'albums' && (
        <div className="section">
          <div className="card-grid">
            {results.slice(0, 12).map(t => (
              <div key={t.id} className="card" onClick={() => onPlay(t, results)}>
                <div className="card-img-wrap">
                  <img src={t.thumbnail} alt={t.title} />
                  <div className="card-play">
                    <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
                <div className="card-title">{t.title}</div>
                <div className="card-sub">{t.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
