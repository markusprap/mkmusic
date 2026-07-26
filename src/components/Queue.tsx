'use client';
import { Track, Profile, toggleLike } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import TrackMenu from './TrackMenu';

type PanelTab = 'queue' | 'lyrics';

interface LyricLine { time: number; text: string }

interface Props {
  queue: Track[];
  currentTrack: Track | null;
  currentIndex: number;
  profile: Profile;
  isPlaying: boolean;
  currentTime: number;
  onPlayTrack: (index: number) => void;
  onProfileChange: (p: Profile) => void;
  onClose: () => void;
}

export default function Queue({ queue, currentTrack, currentIndex, profile, isPlaying, currentTime, onPlayTrack, onProfileChange, onClose }: Props) {
  const [tab, setTab] = useState<PanelTab>('queue');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(false);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const lastFetched = useRef('');
  const bodyRef = useRef<HTMLDivElement>(null);

  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (tab !== 'lyrics' || !currentTrack) return;
    const key = `${currentTrack.id}`;
    if (key === lastFetched.current) return;
    lastFetched.current = key;
    setLyricsLoading(true);
    setLyricsError(false);
    setLyrics([]);
    setIsSynced(false);

    const params = new URLSearchParams({
      title: currentTrack.title,
      artist: currentTrack.artist,
      videoId: currentTrack.id,
    });
    fetch(`/api/lyrics?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.isSynced && d.synced && d.synced.length > 0) {
          setLyrics(d.synced);
          setIsSynced(true);
        } else if (d.plain) {
          setLyrics(d.plain.split('\n').map((t: string) => ({ time: -1, text: t })));
          setIsSynced(false);
        } else setLyricsError(true);
      })
      .catch(() => setLyricsError(true))
      .finally(() => setLyricsLoading(false));
  }, [tab, currentTrack]);

  const activeLyricIdx = isSynced
    ? lyrics.reduce((acc, l, i) => (l.time >= 0 && l.time <= currentTime ? i : acc), -1)
    : -1;

  // Auto-scroll: only scroll when active line changes, not every tick
  const prevActiveIdx = useRef(-1);
  useEffect(() => {
    if (tab !== 'lyrics' || !isSynced || activeLyricIdx === prevActiveIdx.current) return;
    prevActiveIdx.current = activeLyricIdx;
    activeLyricRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLyricIdx, tab, isSynced]);

  const liked = currentTrack ? (profile?.likedIds || []).includes(currentTrack.id) : false;

  function handleLike() {
    if (!currentTrack) return;
    onProfileChange(toggleLike(profile, currentTrack.id));
  }

  return (
    <aside className="right-panel">
      <div className="panel-header">
        <span className="panel-header-title">{tab === 'queue' ? 'Antrian' : 'Lirik'}</span>
        <button className="icon-btn" onClick={onClose} title="Tutup">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="panel-tabs">
        <button className={`panel-tab ${tab==='queue'?'active':''}`} onClick={() => setTab('queue')}>Antrian</button>
        <button className={`panel-tab ${tab==='lyrics'?'active':''}`} onClick={() => setTab('lyrics')}>Lirik</button>
      </div>

      <div className="panel-body">
        {/* Queue */}
        {tab === 'queue' && (
          <>
            {currentTrack && (
              <>
                <div className="queue-section-label">Sedang Diputar</div>
                <div className="queue-item now-playing">
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} />
                  <div className="queue-item-info">
                    <div className="queue-item-title">{currentTrack.title}</div>
                    <div className="queue-item-artist">{currentTrack.artist}</div>
                  </div>
                  {isPlaying && <div className="eq"><span/><span/><span/></div>}
                  <TrackMenu profile={profile} track={currentTrack} onProfileChange={onProfileChange} />
                </div>
              </>
            )}

            {queue.slice(currentIndex + 1).length > 0 && (
              <>
                <div className="queue-section-label" style={{marginTop:8}}>Selanjutnya</div>
                {queue.slice(currentIndex + 1).map((t, i) => (
                  <div key={t.id + i} className="queue-item" onClick={() => onPlayTrack(currentIndex + 1 + i)}>
                    <img src={t.thumbnail} alt={t.title} />
                    <div className="queue-item-info">
                      <div className="queue-item-title">{t.title}</div>
                      <div className="queue-item-artist">{t.artist}</div>
                    </div>
                    <TrackMenu profile={profile} track={t} onProfileChange={onProfileChange} />
                  </div>
                ))}
              </>
            )}

            {queue.length === 0 && (
              <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 16px',fontSize:14}}>
                Antrian kosong. Putar lagu untuk menambahkan.
              </p>
            )}
          </>
        )}

        {/* Lyrics */}
        {tab === 'lyrics' && (
          <>
            {!currentTrack && (
              <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 16px',fontSize:14}}>Putar lagu untuk melihat lirik</p>
            )}
            {lyricsLoading && (
              <div style={{padding:'40px 16px',display:'flex',flexDirection:'column',gap:12}}>
                {Array(8).fill(0).map((_,i) => (
                  <div key={i} className="skeleton" style={{height:14,borderRadius:3,width:`${60+Math.random()*30}%`}} />
                ))}
              </div>
            )}
            {lyricsError && !lyricsLoading && (
              <p style={{color:'#b3b3b3',textAlign:'center',padding:'40px 16px',fontSize:14}}>Lirik tidak tersedia untuk lagu ini</p>
            )}
            {!lyricsLoading && !lyricsError && lyrics.map((line, i) => (
              <div key={i}
                ref={i === activeLyricIdx ? activeLyricRef : null}
                className={`lyric-line ${i === activeLyricIdx ? 'active' : ''}`}>
                {line.text}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
