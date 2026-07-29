'use client';
import { Track, Profile, createPlaylist, addToPlaylist } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import TrackMenu from './TrackMenu';
import NamePromptModal from './NamePromptModal';
import VinylArt from './VinylArt';
import TrackImg from './TrackImg';
import { useDragReorder } from '@/lib/useDragReorder';
import { useHScroll } from '@/lib/useHScroll';
import ScrollArrows from './ScrollArrows';

interface SimilarArtist { id: string; name: string; thumbnail: string }
interface ArtistRelease { id: string; name: string; year: number | null; thumbnail: string }

interface LyricLine { time: number; text: string }
type ExpTab = 'queue' | 'lyrics' | 'related';
type ViewMode = 'lagu' | 'video';

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
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onOpenAlbum: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onStartMix: (t: Track) => void;
  onPlayNext: (t: Track) => void;
  onDismissQueue: () => void;
}

function fmtTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

export default function ExpandedPlayer(props: Props) {
  const { track, queue, currentIndex, profile, isPlaying, shuffle, repeat, currentTime, duration, volume, dynamicRgb, onClose } = props;
  const [tab, setTab] = useState<ExpTab>('queue');
  const { dragIndex, overIndex, handleProps } = useDragReorder(props.onReorderQueue);
  const relatedScroll = useHScroll<HTMLDivElement>();
  const similarScroll = useHScroll<HTMLDivElement>();
  const releasesScroll = useHScroll<HTMLDivElement>();
  // Lagu/Video is a separate switcher from the Antrian/Lirik/Terkait tabs
  // above — it swaps the visual only. Audio keeps playing through the
  // existing player regardless of which one is selected — the iframe
  // itself is muted (mute=1) below, since a YouTube embed plays its own
  // audio by default and that was clashing/doubling with the custom player.
  const [viewMode, setViewMode] = useState<ViewMode>('lagu');
  // Snapshot currentTime only at the moment we switch INTO video mode (not
  // on every tick — that would remount/reload the iframe constantly). This
  // is a one-time position match, not continuous re-sync: the embedded
  // YouTube player and the custom audio element are two independent
  // clocks, so they can still drift apart over a long video. True
  // continuous sync would need the YouTube IFrame JS API (postMessage
  // seekTo calls) — a bigger lift, worth doing later if drift is noticeable.
  const [videoStart, setVideoStart] = useState(0);
  const prevViewMode = useRef<ViewMode>('lagu');
  useEffect(() => {
    if (viewMode === 'video' && prevViewMode.current !== 'video') {
      setVideoStart(Math.floor(currentTime));
    }
    prevViewMode.current = viewMode;
  }, [viewMode, currentTime]);

  // Visible video is driven by the real YouTube IFrame API (not just a
  // static autoplay=1/0 URL param) so play/pause actually tracks the real
  // audio player — Player.tsx's hidden audio engine already loads this same
  // window.YT script, so this just polls for it rather than loading twice
  // or fighting over the single global onYouTubeIframeAPIReady callback.
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<any>(null);

  useEffect(() => {
    if (viewMode !== 'video') {
      videoPlayerRef.current?.destroy?.();
      videoPlayerRef.current = null;
      return;
    }
    let cancelled = false;
    let poll: ReturnType<typeof setTimeout>;
    function init() {
      if (cancelled) return;
      if (!(window as any).YT?.Player) {
        // Can't assume Player.tsx already loaded this script — it skips
        // loading the YT iframe API entirely when Background Mode is on
        // (it uses a native <audio> engine instead there), which would
        // otherwise leave this polling forever with nothing to find.
        if (!document.getElementById('yt-iframe-api')) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        poll = setTimeout(init, 150);
        return;
      }
      if (!videoContainerRef.current) return;
      videoPlayerRef.current = new (window as any).YT.Player(videoContainerRef.current, {
        videoId: track.id,
        playerVars: {
          start: videoStart, autoplay: 1, mute: 1, controls: 0, modestbranding: 1,
          rel: 0, disablekb: 1, iv_load_policy: 3, fs: 0, playsinline: 1,
        },
        events: {
          onReady: (e: any) => { if (!isPlaying) e.target.pauseVideo(); },
        },
      });
    }
    init();
    return () => {
      cancelled = true;
      clearTimeout(poll);
      videoPlayerRef.current?.destroy?.();
      videoPlayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, track.id]);

  // Keeps the visible video's play/pause following the real audio player.
  useEffect(() => {
    if (viewMode !== 'video') return;
    const p = videoPlayerRef.current;
    if (isPlaying) p?.playVideo?.(); else p?.pauseVideo?.();
  }, [isPlaying, viewMode]);

  // Mobile-only bottom sheet (Antrian/Lirik/Terkait) — starts collapsed to a
  // peek/handle so the vinyl/video takes the full screen first, like YT
  // Music/Spotify, instead of showing tab content immediately. Desktop
  // ignores all of this (its CSS never applies the transform). Drag math
  // uses a fixed peek height + 70vh sheet height rather than measuring the
  // real content height — a live device only needs "past halfway" snapping,
  // not pixel-perfect sizing.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; base: number } | null>(null);
  const SHEET_PEEK = 110; // keep in sync with .expanded-sheet's translateY in globals.css — tall enough to show the handle + full tab row while closed
  const SHEET_HEIGHT_RATIO = 0.92; // keep in sync with .expanded-sheet's height in globals.css
  const closedOffset = () => (typeof window === 'undefined' ? 0 : window.innerHeight * SHEET_HEIGHT_RATIO - SHEET_PEEK);

  function onSheetDragStart(e: React.PointerEvent) {
    dragStart.current = { y: e.clientY, base: sheetOpen ? 0 : closedOffset() };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onSheetDragMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const max = closedOffset();
    setDragOffset(Math.max(0, Math.min(max, dragStart.current.base + (e.clientY - dragStart.current.y))));
  }
  function onSheetDragEnd() {
    if (!dragStart.current) return;
    const max = closedOffset();
    setSheetOpen((dragOffset ?? dragStart.current.base) < max / 2);
    dragStart.current = null;
    setDragOffset(null);
  }
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const lastFetched = useRef('');
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const lastFetchedRelated = useRef('');
  const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([]);
  const [artistReleases, setArtistReleases] = useState<ArtistRelease[]>([]);
  const [artistName, setArtistName] = useState('');
  const lastFetchedArtist = useRef('');

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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

  // Similar artists + more-from-artist reuse the same /api/artist route
  // Home.tsx already calls — similarArtists is really a related radio/
  // playlist shelf (ytmusic-api quirk, confirmed earlier this session), not
  // true artist entities, so no subscriber counts exist to show (skipped
  // rather than fabricated).
  useEffect(() => {
    if (tab !== 'related' || !track.artistId) return;
    const key = track.artistId;
    if (key === lastFetchedArtist.current) return;
    lastFetchedArtist.current = key;
    setSimilarArtists([]);
    setArtistReleases([]);
    fetch(`/api/artist?id=${track.artistId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.artist) return;
        setArtistName(d.artist.name ?? '');
        setSimilarArtists(d.artist.similarArtists ?? []);
        setArtistReleases([...(d.artist.topSingles ?? []), ...(d.artist.topAlbums ?? [])]);
      })
      .catch(() => {});
  }, [tab, track.artistId]);

  const activeLyricIdx = isSynced
    ? lyrics.reduce((acc, l, i) => (l.time >= 0 && l.time <= currentTime ? i : acc), -1)
    : -1;

  const prevIdx = useRef(-1);
  useEffect(() => {
    if (tab !== 'lyrics' || !isSynced || activeLyricIdx === prevIdx.current) return;
    prevIdx.current = activeLyricIdx;
    activeLyricRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLyricIdx, tab, isSynced]);

  // Saves the current queue as a new playlist — reuses the existing
  // createPlaylist/addToPlaylist pair (same ones Library.tsx uses), just
  // applied to every track in `queue` instead of one at a time. Naming goes
  // through the same NamePromptModal the rest of the app uses for playlist
  // creation (TrackMenu's "+ Playlist Baru"), not a native window.prompt.
  const [showSaveQueueModal, setShowSaveQueueModal] = useState(false);
  function submitSaveQueue(name: string) {
    const { profile: withPlaylist, playlist } = createPlaylist(profile, name);
    const updated = queue.reduce((p, t) => addToPlaylist(p, playlist.id, t.id), withPlaylist);
    props.onProfileChange(updated);
    setShowSaveQueueModal(false);
  }

  const PlayPauseIcon = ({ size }: { size: number }) => isPlaying
    ? <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    : <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>;

  const SkipNextIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
  );

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
          <div className="view-toggle">
            <button className={viewMode === 'lagu' ? 'active' : ''} onClick={() => setViewMode('lagu')} title="Lagu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            </button>
            <button className={viewMode === 'video' ? 'active' : ''} onClick={() => setViewMode('video')} title="Video">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="3"/>
                <polygon points="10,9 15,12 10,15" fill="currentColor" stroke="none"/>
              </svg>
            </button>
          </div>
          <TrackMenu profile={profile} track={track} onProfileChange={props.onProfileChange}
            onStartMix={props.onStartMix} onPlayNext={props.onPlayNext}
            onOpenArtist={props.onOpenArtist} onDismissQueue={props.onDismissQueue} />
        </div>

        {/* Body */}
        <div className="expanded-body">
          {/* Left: art + info */}
          <div className={`expanded-art-col${viewMode === 'video' ? ' video-mode' : ''}`}>
            {viewMode === 'lagu' ? (
              <VinylArt thumbnail={track.thumbnail} spinning={isPlaying} style={{ width: '100%', height: 'auto', aspectRatio: '1' }} />
            ) : (
              <div className="expanded-video-wrap">
                {/* YT.Player replaces this div with its own iframe once the
                    API is ready. A transparent blocker sits on top so none
                    of YouTube's own UI (title, channel, share icons) is
                    ever clickable — this is visual-only, audio comes from
                    the real player. */}
                <div ref={videoContainerRef} />
                <div className="expanded-video-blocker" />
              </div>
            )}
            <div className="expanded-art-meta">
              <div className="expanded-track-name">{track.title}</div>
              <div className="expanded-artist-name" style={{ cursor: track.artistId ? 'pointer' : 'default' }}
                onClick={() => track.artistId && props.onOpenArtist(track.artistId)}>
                {track.artist}
              </div>
            </div>
          </div>

          {/* Right: tabs + content — a draggable bottom sheet on mobile, a plain column on desktop */}
          <div className={`expanded-right-col expanded-sheet${sheetOpen ? ' open' : ''}`}
            style={dragOffset !== null ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}>
            <div className="expanded-sheet-grip"
              onPointerDown={onSheetDragStart} onPointerMove={onSheetDragMove}
              onPointerUp={onSheetDragEnd} onPointerCancel={onSheetDragEnd}>
              <div className="expanded-sheet-handle" />
            </div>
            {/* Mini now-playing row — replaces the big vinyl/video once the
                sheet is dragged open, so the queue/lyrics/related content
                gets most of the screen instead of competing with it. */}
            <div className="expanded-sheet-mini-header">
              <div className="expanded-sheet-mini-thumb">
                <TrackImg src={track.thumbnail} alt={track.title} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                {isPlaying && (
                  <div className="expanded-sheet-mini-eq">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg>
                  </div>
                )}
              </div>
              <div className="expanded-sheet-mini-info">
                <div className="expanded-sheet-mini-title">{track.title}</div>
                <div className="expanded-sheet-mini-artist" style={{ cursor: track.artistId ? 'pointer' : 'default' }}
                  onClick={() => track.artistId && props.onOpenArtist(track.artistId)}>
                  {track.artist}
                </div>
              </div>
              <button className="icon-btn" onClick={props.onPlayPause}>
                <PlayPauseIcon size={20} />
              </button>
              <button className="icon-btn" onClick={props.onNext} title="Selanjutnya">
                <SkipNextIcon size={20} />
              </button>
            </div>
            <div className="expanded-panel-tabs">
              {(['queue','lyrics','related'] as ExpTab[]).map(t => (
                <button key={t} className={`exp-tab ${tab===t?'active':''}`}
                  onClick={() => { setTab(t); setSheetOpen(true); }}>
                  {t==='queue'?'Antrian':t==='lyrics'?'Lirik':'Terkait'}
                </button>
              ))}
            </div>
            <div className="expanded-panel-body">
              {tab === 'queue' && (
                <>
                  <div className="queue-playing-from">
                    <div>
                      <div className="queue-playing-from-label">Diputar dari</div>
                      <div className="queue-playing-from-name">Antrian Anda</div>
                    </div>
                    <button className="btn-outline queue-save-btn" onClick={() => setShowSaveQueueModal(true)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/>
                        <line x1="19" y1="8" x2="19" y2="18"/><line x1="14.5" y1="13" x2="23.5" y2="13"/>
                      </svg>
                      Simpan
                    </button>
                  </div>
                  {queue.map((t, i) => (
                    <div key={t.id+i}
                      className={`queue-item ${i===currentIndex?'now-playing':''}${dragIndex===i?' dragging':''}${overIndex===i&&dragIndex!==i?' drag-over':''}`}
                      onClick={() => props.onPlayIndex(i)}>
                      <TrackImg src={t.thumbnail} alt={t.title} />
                      <div className="queue-item-info">
                        <div className="queue-item-title">{t.title}</div>
                        <div className="queue-item-artist">{t.artist}</div>
                      </div>
                      {i === currentIndex && isPlaying && <div className="eq"><span/><span/><span/></div>}
                      {i !== currentIndex && (
                        <div className="queue-drag-handle" onClick={e => e.stopPropagation()} {...handleProps(i)}>
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/>
                          </svg>
                        </div>
                      )}
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
                  {relatedTracks.length > 0 && (
                    <div className="related-section">
                      <div className="related-section-head">
                        <h3>Mungkin Anda suka juga</h3>
                        <ScrollArrows canPrev={relatedScroll.canPrev} canNext={relatedScroll.canNext}
                          onPrev={relatedScroll.scrollPrev} onNext={relatedScroll.scrollNext} />
                      </div>
                      <div ref={relatedScroll.ref} className="related-grid">
                        {relatedTracks.map((t, i) => (
                          <div key={t.id+i} className="related-track-card" onClick={() => props.onPlay(t, relatedTracks)}>
                            <TrackImg src={t.thumbnail} alt={t.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            <div className="related-track-info">
                              <div className="related-track-title">{t.title}</div>
                              <div className="related-track-artist">{t.artist}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {similarArtists.length > 0 && (
                    <div className="related-section">
                      <div className="related-section-head">
                        <h3>Artis serupa</h3>
                        <ScrollArrows canPrev={similarScroll.canPrev} canNext={similarScroll.canNext}
                          onPrev={similarScroll.scrollPrev} onNext={similarScroll.scrollNext} />
                      </div>
                      <div ref={similarScroll.ref} className="related-scroll-row">
                        {similarArtists.map(a => (
                          <div key={a.id} className="related-artist-card">
                            <TrackImg src={a.thumbnail} alt={a.name} style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover' }} />
                            <div className="related-artist-name">{a.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {artistReleases.length > 0 && (
                    <div className="related-section">
                      <div className="related-section-head">
                        <h3>Lainnya dari {artistName}</h3>
                        <ScrollArrows canPrev={releasesScroll.canPrev} canNext={releasesScroll.canNext}
                          onPrev={releasesScroll.scrollPrev} onNext={releasesScroll.scrollNext} />
                      </div>
                      <div ref={releasesScroll.ref} className="related-scroll-row">
                        {artistReleases.map(r => (
                          <div key={r.id} className="related-release-card" onClick={() => props.onOpenAlbum(r.id)}>
                            <TrackImg src={r.thumbnail} alt={r.name} style={{ width: 130, height: 130, borderRadius: 8, objectFit: 'cover' }} />
                            <div className="related-release-name">{r.name}</div>
                            {r.year && <div className="related-release-year">{r.year}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                <line x1="4" y1="4" x2="9" y2="9"/>
              </svg>
            </button>
            <button className="icon-btn" onClick={props.onPrev} title="Sebelumnya">
              <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            <button className="exp-play-btn" onClick={props.onPlayPause}>
              <PlayPauseIcon size={26} />
            </button>
            <button className="icon-btn" onClick={props.onNext} title="Selanjutnya">
              <SkipNextIcon size={26} />
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
      {showSaveQueueModal && (
        <NamePromptModal title="Simpan Antrian sebagai Playlist" placeholder="Nama playlist"
          onSubmit={submitSaveQueue} onClose={() => setShowSaveQueueModal(false)} />
      )}
    </div>
  );
}
