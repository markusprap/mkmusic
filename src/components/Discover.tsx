'use client';
import { Track, cacheTrack } from '@/lib/store';
import { useState, useCallback } from 'react';

const CHARTS = [
  { name: '🌏 Global Top 50', query: 'top 50 global hits 2024' },
  { name: '🇮🇩 Indonesia', query: 'top hits indonesia 2024' },
  { name: '🔥 Trending', query: 'viral trending songs 2024' },
  { name: '💎 Klasik', query: 'classic hits all time best' },
];

const MOODS = [
  { name: 'Energik', color: '#e91e8c', query: 'energetic workout hits' },
  { name: 'Santai', color: '#2196f3', query: 'chill lofi relaxing' },
  { name: 'Fokus', color: '#9c27b0', query: 'focus study music instrumental' },
  { name: 'Bahagia', color: '#ff9800', query: 'happy upbeat songs' },
  { name: 'Romantis', color: '#e53935', query: 'romantic love ballads' },
  { name: 'Party', color: '#ffd600', query: 'party dance club' },
  { name: 'Tidur', color: '#37474f', query: 'sleep calm ambient' },
  { name: 'Workout', color: '#00bcd4', query: 'workout gym motivation' },
];

const GENRES = [
  { name: 'Pop', color: '#e91e8c', query: 'pop music 2024' },
  { name: 'Hip-Hop', color: '#ff6f00', query: 'hip hop rap 2024' },
  { name: 'Electronic', color: '#6200ea', query: 'electronic edm 2024' },
  { name: 'R&B', color: '#c62828', query: 'rnb soul 2024' },
  { name: 'Rock', color: '#1565c0', query: 'rock music 2024' },
  { name: 'Indie', color: '#2e7d32', query: 'indie alternative 2024' },
  { name: 'Jazz', color: '#4e342e', query: 'jazz music' },
  { name: 'K-Pop', color: '#ad1457', query: 'kpop 2024' },
  { name: 'Dangdut', color: '#d84315', query: 'dangdut koplo' },
  { name: 'Klasik', color: '#263238', query: 'classical instrumental' },
];

interface Props { onPlay: (t: Track, queue: Track[]) => void; onSearch: (q: string) => void }

export default function Discover({ onPlay, onSearch }: Props) {
  const [loadingChart, setLoadingChart] = useState<string|null>(null);
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [activeChart, setActiveChart] = useState<string|null>(null);

  const loadChart = useCallback(async (query: string, name: string) => {
    if (loadingChart) return;
    setLoadingChart(name);
    setActiveChart(name);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const tracks: Track[] = data.tracks ?? [];
      tracks.forEach(cacheTrack);
      setChartTracks(tracks);
    } catch { setChartTracks([]); } finally { setLoadingChart(null); }
  }, [loadingChart]);

  return (
    <div className="main-content-inner animate-in">
      {/* Header */}
      <div className="page-header-gradient" style={{paddingBottom:24}}>
        <div className="page-header-gradient-bg" style={{background:'linear-gradient(180deg,rgba(100,65,165,.4) 0%,#121212 100%)'}} />
        <h1 style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:900,marginBottom:6}}>Jelajahi</h1>
        <p style={{color:'#b3b3b3',fontSize:14}}>Temukan musik baru berdasarkan genre, suasana, dan chart terkini</p>
      </div>

      {/* Charts */}
      <div className="section">
        <h2 className="section-title" style={{marginBottom:16}}>🏆 Chart Musik</h2>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:24}}>
          {CHARTS.map(c => (
            <button key={c.name} onClick={() => loadChart(c.query, c.name)}
              className={`chip ${activeChart===c.name?'active':''}`}
              style={{opacity:loadingChart===c.name?.5:1}}>
              {loadingChart === c.name ? '...' : c.name}
            </button>
          ))}
        </div>

        {chartTracks.length > 0 && (
          <div className="track-list">
            {chartTracks.slice(0, 10).map((t, i) => (
              <div key={t.id} className="track-row" onClick={() => onPlay(t, chartTracks)}>
                <div className="track-num-cell" style={{fontWeight:700,fontSize:16,color:i<3?'#1db954':'#b3b3b3'}}>{i+1}</div>
                <div className="track-play-icon">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
                <div className="track-info">
                  <img className="track-img" src={t.thumbnail} alt={t.title} />
                  <div className="track-meta">
                    <div className="track-title">{t.title}</div>
                    <div className="track-artist">{t.artist}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:'#b3b3b3'}} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moods */}
      <div className="section">
        <h2 className="section-title" style={{marginBottom:16}}>🎭 Suasana Hati</h2>
        <div className="mood-grid">
          {MOODS.map(m => (
            <div key={m.name} className="genre-card"
              style={{background:`linear-gradient(135deg,${m.color}cc,${m.color}44)`}}
              onClick={() => onSearch(m.query)}>
              <span className="genre-card-name">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div className="section">
        <h2 className="section-title" style={{marginBottom:16}}>🎸 Genre</h2>
        <div className="search-categories">
          {GENRES.map(g => (
            <div key={g.name} className="search-category-card"
              style={{background:`linear-gradient(135deg,${g.color}dd,${g.color}66)`}}
              onClick={() => onSearch(g.query)}>
              <span className="search-category-label">{g.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
