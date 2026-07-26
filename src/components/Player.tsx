'use client';
import { Track, Profile, toggleLike } from '@/lib/store';
import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerRef {
  seekTo: (s: number) => void;
  setVolume: (v: number) => void;
  pause: () => void;
  play: () => void;
}

interface Props {
  track: Track | null;
  queue: Track[];
  currentIndex: number;
  profile: Profile;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  volume: number;
  showQueue: boolean;
  showExpanded: boolean;
  currentTime: number;
  duration: number;
  dynamicRgb: string;
  playerRef: React.MutableRefObject<PlayerRef>;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onVolume: (v: number) => void;
  onSeek: (s: number) => void;
  onTimeUpdate: (cur: number, dur: number) => void;
  onTrackEnd: () => void;
  onToggleQueue: () => void;
  onToggleExpanded: () => void;
  onProfileChange: (p: Profile) => void;
}

function fmtTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function Player(props: Props) {
  const { track, isPlaying, shuffle, repeat, volume, currentTime, duration } = props;
  const ytPlayerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [ytReady, setYtReady] = useState(false);

  // Keep latest onTrackEnd callback in ref to prevent stale closure bugs in YT event handler
  const onTrackEndRef = useRef(props.onTrackEnd);
  useEffect(() => {
    onTrackEndRef.current = props.onTrackEnd;
  }, [props.onTrackEnd]);

  // Load YT iFrame API once
  useEffect(() => {
    if (window.YT?.Player) { setYtReady(true); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
  }, []);

  // Initialize YT player when API is ready
  useEffect(() => {
    if (!ytReady || !iframeContainerRef.current || ytPlayerRef.current) return;
    ytPlayerRef.current = new window.YT.Player(iframeContainerRef.current, {
      height: '1',
      width: '1',
      playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onStateChange: (e: any) => {
          // YT.PlayerState.ENDED === 0
          if (e.data === 0) {
            console.log('[mkmusic] Track ended, calling onTrackEnd');
            onTrackEndRef.current();
          }
        },
      },
    });

    // Expose controls via ref
    props.playerRef.current = {
      seekTo: (s) => ytPlayerRef.current?.seekTo?.(s, true),
      setVolume: (v) => ytPlayerRef.current?.setVolume?.(v),
      pause: () => ytPlayerRef.current?.pauseVideo?.(),
      play: () => ytPlayerRef.current?.playVideo?.(),
    };
  }, [ytReady]); // eslint-disable-line

  // Load new video when track changes
  useEffect(() => {
    if (!track || !ytPlayerRef.current) return;
    try {
      if (typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById(track.id);
        if (isPlaying) {
          setTimeout(() => {
            ytPlayerRef.current?.playVideo?.();
          }, 150);
        }
      }
    } catch (err) {
      console.error('[mkmusic] loadVideoById error:', err);
    }
  }, [track?.id]); // eslint-disable-line

  // Sync play/pause
  useEffect(() => {
    if (!ytPlayerRef.current) return;
    try {
      if (isPlaying) ytPlayerRef.current.playVideo?.();
      else ytPlayerRef.current.pauseVideo?.();
    } catch { /* ignore */ }
  }, [isPlaying]);

  // Volume sync
  useEffect(() => {
    try { ytPlayerRef.current?.setVolume?.(volume); } catch { /* ignore */ }
  }, [volume]);

  // Media Session: lock-screen/notification controls, and signals the browser
  // this tab is actively playing media so it's not suspended in the background.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', props.onPlayPause);
    navigator.mediaSession.setActionHandler('pause', props.onPlayPause);
    navigator.mediaSession.setActionHandler('previoustrack', props.onPrev);
    navigator.mediaSession.setActionHandler('nexttrack', props.onNext);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) props.onSeek(details.seekTime);
    });
  }, [track?.id]); // eslint-disable-line

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Time tracking
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (!ytPlayerRef.current) return;
      try {
        const cur = ytPlayerRef.current.getCurrentTime?.() ?? 0;
        const dur = ytPlayerRef.current.getDuration?.() ?? 0;
        props.onTimeUpdate(cur, dur);
      } catch { /* ignore */ }
    }, 500);
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, []); // eslint-disable-line

  const handleSeek = useCallback((s: number) => {
    try { ytPlayerRef.current?.seekTo?.(s, true); } catch { /* ignore */ }
    props.onSeek(s);
  }, []); // eslint-disable-line

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = track ? (props.profile?.likedIds || []).includes(track.id) : false;

  const iframeStyle: React.CSSProperties = {
    position: 'fixed',
    width: '1px',
    height: '1px',
    left: '-9999px',
    top: '-9999px',
    opacity: 0.01,
    pointerEvents: 'none',
  };

  if (!track) {
    return (
      <footer className="player-bar">
        {/* Hidden YT iframe with non-zero dimensions to avoid browser throttling */}
        <div style={iframeStyle}><div ref={iframeContainerRef} /></div>
        <div className="player-left" style={{gap:12}}>
          <div style={{width:56,height:56,borderRadius:4,background:'#282828',flexShrink:0}} />
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#b3b3b3'}}>mkmusic</div>
            <div style={{fontSize:12,color:'#727272'}}>Pilih lagu untuk memutar</div>
          </div>
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button className="icon-btn" disabled><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg></button>
            <button className="icon-btn" disabled><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></svg></button>
            <button className="play-btn" disabled><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></button>
            <button className="icon-btn" disabled><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg></button>
            <button className="icon-btn" disabled><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>
          </div>
          <div className="seek-row">
            <span className="seek-time">0:00</span>
            <input type="range" min={0} max={100} value={0} className="seek-bar" readOnly style={{'--p':'0%'} as any} />
            <span className="seek-time">0:00</span>
          </div>
        </div>
        <div className="player-right" />
      </footer>
    );
  }

  return (
    <footer className="player-bar">
      {/* Hidden YT iFrame */}
      <div style={iframeStyle}><div ref={iframeContainerRef} /></div>

      {/* LEFT: track info */}
      <div className="player-left">
        <img className="player-thumb" src={track.thumbnail} alt={track.title}
          onClick={props.onToggleExpanded} title="Perbesar" />
        <div className="player-track-info">
          <div className="player-title" title={track.title}>{track.title}</div>
          <div className="player-artist" title={track.artist}>{track.artist}</div>
        </div>
        <button className={`icon-btn ${liked?'active':''}`}
          onClick={() => props.onProfileChange(toggleLike(props.profile, track.id))} title="Sukai">
          <svg width="18" height="18" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* CENTER: controls */}
      <div className="player-center">
        <div className="player-controls">
          <button className={`icon-btn ${shuffle?'active':''}`} onClick={props.onShuffle} title="Acak">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={props.onPrev} title="Sebelumnya">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className="play-btn" onClick={props.onPlayPause}>
            {isPlaying
              ? <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>}
          </button>
          <button className="icon-btn" onClick={props.onNext} title="Selanjutnya">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className={`icon-btn ${repeat!=='off'?'active':''}`} onClick={props.onRepeat} title="Ulangi">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </button>
        </div>
        <div className="seek-row">
          <span className="seek-time">{fmtTime(currentTime)}</span>
          <input type="range" min={0} max={duration || 100} value={currentTime}
            className="seek-bar" style={{'--p':`${progress}%`} as React.CSSProperties}
            onChange={e => handleSeek(Number(e.target.value))} />
          <span className="seek-time">{fmtTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: utilities */}
      <div className="player-right">
        <button className={`icon-btn ${props.showQueue?'active':''}`} onClick={props.onToggleQueue} title="Antrian & Lirik">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        <div className="vol-wrap">
          <button className="icon-btn" onClick={() => props.onVolume(volume === 0 ? 80 : 0)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
              {volume > 0 && volume <= 50 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
            </svg>
          </button>
          <input type="range" min={0} max={100} value={volume} className="vol-slider"
            style={{'--p':`${volume}%`} as React.CSSProperties}
            onChange={e => props.onVolume(Number(e.target.value))} />
        </div>
        <button className="icon-btn" onClick={props.onToggleExpanded} title="Perbesar">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>
      </div>
    </footer>
  );
}
