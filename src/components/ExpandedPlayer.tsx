'use client';
import { Track, Profile, toggleLike, createPlaylist, addToPlaylist } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import TrackMenu from './TrackMenu';

interface LyricLine { time: number; text: string }
type ExpTab = 'queue' | 'lyrics' | 'related';

interface Props {
  track: Track;
  queue: Track[];
  currentIndex: number;
  profile: Profile;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  currentTime: number;
  duration: number;
  volume: number;
  dynamicRgb: string;
  onClose: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (s: number) => void;
  onVolume: (v: number) => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onProfileChange: (p: Profile) => void;
  onPlayIndex: (i: number) => void;
  onPlay: (t: Track, queue: Track[]) => void;
}

function fmtTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

export default function ExpandedPlayer(props: Props) {
  const { track, queue, currentIndex, profile, isPlaying, shuffle, repeat, currentTime, duration, volume, dynamicRgb, onClose } = props;
  const [tab, setTab] = useState<ExpTab>('queue');
  const [showMenu, setShowMenu] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const lastFetched = useRef('');
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const lastFetchedRelated = useRef('');

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = (profile?.likedIds || []).includes(track.id);

  function handleAddToPlaylist(playlistId: string) {
    props.onProfileChange(addToPlaylist(profile, playlistId, track.id));
    setShowMenu(false);
  }

  function handleNewPlaylist() {
    const name = window.prompt('Nama playlist baru:');
    setShowMenu(false);
    if (!name || !name.trim()) return;
    const { profile: withPlaylist, playlist } = createPlaylist(profile, name.trim());
    props.onProfileChange(addToPlaylist(withPlaylist, playlist.id, track.id));
  }

  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (tab !== 'lyrics') return;
    const key = `${track.id}`;
    if (key === lastFetched.current) return;
    lastFetched.current = key;
    setLyricsLoading(true);
    setLyrics([]);
    setIsSynced(false);
    const params = new URLSearchParams({
      title: track.title,
      artist: track.artist,
      videoId: track.id,
    });
    fetch(`/api/lyrics?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.isSynced && d.synced?.length) {
          setLyrics(d.synced);
          setIsSynced(true);
        } else if (d.plain) {
          setLyrics(d.plain.split('\n').map((t: string) => ({ time: -1, text: t })));
          setIsSynced(false);
        }
      })
      .catch(() => {})
      .finally(() => setLyricsLoading(false));
  }, [tab, track]);

  useEffect(() => {
    if (tab !== 'related') return;
    const key = track.id;
    if (key === lastFetchedRelated.current) return;
    lastFetchedRelated.current = key;
    setRelatedLoading(true);
    setRelatedTracks([]);
    fetch(`/api/upnext?videoId=${track.id}`)
      .then(r => r.json())
      .then(d => setRelatedTracks(d.tracks ?? []))
      .catch(() => {})
      .finally(() => setRelatedLoading(false));
  }, [tab, track]);

  const activeLyricIdx = isSynced
    ? lyrics.reduce((acc, l, i) => (l.time >= 0 && l.time <= currentTime ? i : acc), -1)
    : -1;

  const prevIdx = useRef(-1);
  useEffect(() => {
    if (tab !== 'lyrics' || !isSynced || activeLyricIdx === prevIdx.current) return;
    prevIdx.current = activeLyricIdx;
    activeLyricRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLyricIdx, tab, isSynced]);

  const RepeatIcon = () => {
    if (repeat === 'one') return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="15" fontSize="8" fill="currentColor" fontWeight="bold">1</text>
      </svg>
    );
    return (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    );
  };

  return (
    <div className="expanded-overlay">
      <div className="expanded-bg" style={{background:`radial-gradient(ellipse at 30% 20%,rgba(${dynamicRgb},.55) 0%,#000 65%)`}} />
      <div className="expanded-blur" />
      <div className="expanded-inner">
        {/* Top bar */}
        <div className="expanded-topbar">
          <button className="icon-btn" onClick={onClose} title="Perkecil">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <span className="expanded-source">Memutar dari Antrian</span>
          <div style={{position:'relative'}}>
            <button className="icon-btn" onClick={() => setShowMenu(m => !m)} title="Opsi lagu">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
            {showMenu && (
              <>
                <div style={{position:'fixed',inset:0,zIndex:399}} onClick={() => setShowMenu(false)} />
                <div className="ctx-menu" style={{position:'absolute',top:'calc(100% + 8px)',right:0,left:'auto'}}>
                  <div className="ctx-item" style={{opacity:.6,cursor:'default'}}>Tambah ke playlist</div>
                  {(profile?.playlists || []).map(pl => (
                    <div key={pl.id} className="ctx-item" onClick={() => handleAddToPlaylist(pl.id)}>{pl.name}</div>
                  ))}
                  <div className="ctx-divider" />
                  <div className="ctx-item" onClick={handleNewPlaylist}>+ Playlist Baru</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="expanded-body">
          {/* Left: art + info */}
          <div className="expanded-art-col">
            <img src={track.thumbnail} alt={track.title} />
            <div className="expanded-art-meta">
              <div className="expanded-track-name">{track.title}</div>
              <div className="expanded-artist-name">{track.artist}</div>
              <div className="expanded-art-actions">
                <button className={`icon-btn ${liked ? 'active' : ''}`} onClick={() => props.onProfileChange(toggleLike(profile, track.id))} title="Sukai">
                  <svg width="22" height="22" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right: tabs + content */}
          <div className="expanded-right-col">
            <div className="expanded-panel-tabs">
              {(['queue','lyrics','related'] as ExpTab[]).map(t => (
                <button key={t} className={`exp-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                  {t==='queue'?'Antrian':t==='lyrics'?'Lirik':'Terkait'}
                </button>
              ))}
            </div>
            <div className="expanded-panel-body">
              {tab === 'queue' && (
                <>
                  {queue.map((t, i) => (
                    <div key={t.id+i} className={`queue-item ${i===currentIndex?'now-playing':''}`} onClick={() => props.onPlayIndex(i)}>
                      <img src={t.thumbnail} alt={t.title} />
                      <div className="queue-item-info">
                        <div className="queue-item-title">{t.title}</div>
                        <div className="queue-item-artist">{t.artist}</div>
                      </div>
                      {i === currentIndex && isPlaying && <div className="eq"><span/><span/><span/></div>}
                    </div>
                  ))}
                </>
              )}
              {tab === 'lyrics' && (
                <div>
                  {lyricsLoading && Array(8).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:14,margin:'12px 20px',borderRadius:3}}/>)}
                  {!lyricsLoading && lyrics.length === 0 && <p className="lyric-line" style={{opacity:.5}}>Lirik tidak tersedia</p>}
                  {lyrics.map((line, i) => (
                    <div key={i} ref={i===activeLyricIdx?activeLyricRef:null}
                      className={`lyric-line ${i===activeLyricIdx?'active':''}`}
                      onClick={() => { if (line.time >= 0) props.onSeek(line.time); }}>
                      {line.text}
                    </div>
                  ))}
                </div>
              )}
              {tab === 'related' && (
                <>
                  {relatedLoading && Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:56,margin:'6px 8px',borderRadius:8}}/>)}
                  {!relatedLoading && relatedTracks.length === 0 && (
                    <p className="lyric-line" style={{opacity:.5}}>Rekomendasi terkait tidak tersedia</p>
                  )}
                  {relatedTracks.map((t, i) => (
                    <div key={t.id+i} className="queue-item" onClick={() => props.onPlay(t, relatedTracks)}>
                      <img src={t.thumbnail} alt={t.title} />
                      <div className="queue-item-info">
                        <div className="queue-item-title">{t.title}</div>
                        <div className="queue-item-artist">{t.artist}</div>
                      </div>
                      <TrackMenu profile={profile} track={t} onProfileChange={props.onProfileChange} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="expanded-controls">
          <div className="expanded-seek-row">
            <span className="seek-time">{fmtTime(currentTime)}</span>
            <input type="range" min={0} max={duration||100} value={currentTime}
              className="seek-bar expanded-seek-bar"
              style={{'--p':`${progress}%`} as React.CSSProperties}
              onChange={e => props.onSeek(Number(e.target.value))} />
            <span className="seek-time">{fmtTime(duration)}</span>
          </div>
          <div className="expanded-ctrl-row">
            <button className={`icon-btn ${shuffle?'active':''}`} onClick={props.onShuffle} title="Acak">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                <line x1="4" y1="4" x2="9" y2="9"/>
              </svg>
            </button>
            <button className="icon-btn" onClick={props.onPrev} title="Sebelumnya">
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            <button className="exp-play-btn" onClick={props.onPlayPause}>
              {isPlaying
                ? <svg width="22" height="22" fill="#000" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="22" height="22" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>}
            </button>
            <button className="icon-btn" onClick={props.onNext} title="Selanjutnya">
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            <button className={`icon-btn ${repeat!=='off'?'active':''}`} onClick={props.onRepeat} title="Ulangi">
              <RepeatIcon />
            </button>
          </div>
          <div className="expanded-vol-row">
            <button className="icon-btn">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
                {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
              </svg>
            </button>
            <input type="range" min={0} max={100} value={volume} className="exp-vol-slider"
              style={{'--p':`${volume}%`} as React.CSSProperties}
              onChange={e => props.onVolume(Number(e.target.value))} />
          </div>
        </div>
      </div>
    </div>
  );
}
