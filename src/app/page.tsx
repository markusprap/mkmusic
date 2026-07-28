'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Track, Profile,
  addRecent, cacheTrack, syncProfile, hydrateTracks,
} from '@/lib/store';
import { Room, createRoomRemote, joinRoomRemote, syncRoomRemote, leaveRoomRemote, fetchRoomRemote } from '@/lib/rooms';
import { extractColor } from '@/lib/colorExtract';
import { moveItem, adjustIndexAfterMove } from '@/lib/reorder';

import Splash from '@/components/Splash';
import Welcome from '@/components/Welcome';
import Login from '@/components/Login';
import ProfileSelect from '@/components/ProfileSelect';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import Home from '@/components/Home';
import Search from '@/components/Search';
import Discover from '@/components/Discover';
import Library from '@/components/Library';
import Queue from '@/components/Queue';
import Player from '@/components/Player';
import ExpandedPlayer from '@/components/ExpandedPlayer';
import Credits from '@/components/Credits';
import SupportBanner from '@/components/SupportBanner';
import JoinRoomModal from '@/components/JoinRoomModal';
import RoomCreatedModal from '@/components/RoomCreatedModal';
import Artist from '@/components/Artist';
import Album from '@/components/Album';
import Account from '@/components/Account';

type Tab = 'home' | 'search' | 'discover' | 'library' | 'account';
interface NavLocation { tab: Tab; searchQuery: string; detail: { type: 'artist' | 'album'; id: string } | null }

interface PlayerControl { seekTo: (s: number) => void; setVolume: (v: number) => void; pause: () => void; play: () => void }

export default function App() {
  // ── Splash screen — shown briefly on every load, like Spotify's launch animation ──
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // ── First-visit welcome screen ────────────────
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    setShowWelcome(!localStorage.getItem('mkmusic_welcomed'));
    setWelcomeChecked(true);
  }, []);

  // ── Account session ───────────────────────────
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Profiles ─────────────────────────────────
  // No auto-restore across reloads by design: PIN is required every time a profile is selected.
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  const [, setCacheTick] = useState(0);

  function handleProfileSelect(p: Profile) {
    setActiveProfile(p);
    // Fresh navigation history for this profile — otherwise Back could walk
    // into whatever the previous profile was browsing.
    setNavHistory([{ tab: 'home', searchQuery: '', detail: null }]);
    setNavIndex(0);
    // Liked/recent/playlist tracks are referenced by ID only — the track
    // cache is in-memory and empty on a fresh load, so without this,
    // "Baru Diputar"/"Lagu Disukai"/playlists render empty until something
    // gets played this session. Hydrate once, then re-render to pick it up.
    const ids = [...p.recentIds, ...p.likedIds, ...p.playlists.flatMap(pl => pl.trackIds)];
    hydrateTracks(ids).then(() => setCacheTick(t => t + 1));
  }

  function handleProfileChange(updated: Profile) {
    setActiveProfile(updated);
    syncProfile(updated).catch(() => {});
  }

  function handleAddToQueue(t: Track) {
    cacheTrack(t);
    setQueue(q => [...q, t]);
  }

  function handleSwitchProfile() {
    if (activeRoom && activeProfile) leaveRoomRemote(activeRoom.id, activeProfile.id).catch(() => {});
    setActiveRoom(null);
    setActiveProfile(null);
  }

  function handleSignOut() {
    handleSwitchProfile();
    createClient().auth.signOut();
  }

  // ── Layout State ─────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  // Real in-app navigation history (not the browser's) — activeTab/
  // searchQuery/detailView are derived reads of the current entry, not
  // independent state, so Back/Forward can retrace actual app navigation
  // instead of escaping to whatever real page loaded before this SPA did.
  const [navHistory, setNavHistory] = useState<NavLocation[]>([{ tab: 'home', searchQuery: '', detail: null }]);
  const [navIndex, setNavIndex] = useState(0);
  const { tab: activeTab, searchQuery, detail: detailView } = navHistory[navIndex];

  // Explicit navigation (tab switch, opening a detail view, a submitted
  // search) — truncates any "forward" entries past the current pointer,
  // same as a real browser after navigating post-Back.
  function pushNav(partial: Partial<NavLocation>) {
    const next: NavLocation = { ...navHistory[navIndex], ...partial };
    setNavHistory(h => [...h.slice(0, navIndex + 1), next]);
    setNavIndex(i => i + 1);
  }
  // In-place update, no new history entry — for live search-box typing,
  // which would otherwise flood Back/Forward with one entry per keystroke.
  function replaceNav(partial: Partial<NavLocation>) {
    setNavHistory(h => h.map((loc, i) => i === navIndex ? { ...loc, ...partial } : loc));
  }
  function goBack() { setNavIndex(i => Math.max(0, i - 1)); }
  function goForward() { setNavIndex(i => Math.min(navHistory.length - 1, i + 1)); }
  const canGoBack = navIndex > 0;
  const canGoForward = navIndex < navHistory.length - 1;

  function openArtist(id: string) { if (id) pushNav({ detail: { type: 'artist', id } }); }
  function openAlbum(id: string) { if (id) pushNav({ detail: { type: 'album', id } }); }
  function handleTabChange(tab: Tab) { pushNav({ tab, detail: null }); }

  // ── Player State ─────────────────────────────
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dynamicRgb, setDynamicRgb] = useState('29,185,84');
  const [autoplay, setAutoplay] = useState(true);
  const playerRef = useRef<PlayerControl>({ seekTo: () => {}, setVolume: () => {}, pause: () => {}, play: () => {} });
  const fetchedUpnextForId = useRef<string | null>(null);

  // ── Room (synced listening) ──────────────────
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showRoomCreated, setShowRoomCreated] = useState<string | null>(null);
  const applyingRemoteRef = useRef(false);
  // Mirrors of the latest player state, kept fresh every render so the
  // realtime subscription's callback (set up once per room, not per render)
  // can compare against "what we actually have right now" instead of a
  // stale closure from whenever it was subscribed.
  const liveStateRef = useRef({ queue, currentIndex, isPlaying, currentTime });
  liveStateRef.current = { queue, currentIndex, isPlaying, currentTime };

  const currentTrack = queue[currentIndex] ?? null;

  // ── Helper to fetch recommendations for autoplay ─────
  const fetchAutoplayQueue = useCallback(async (trackId: string, currentQ: Track[]) => {
    if (fetchedUpnextForId.current === trackId) return currentQ;
    fetchedUpnextForId.current = trackId;
    try {
      const res = await fetch(`/api/upnext?videoId=${trackId}`);
      const data = await res.json();
      const newTracks: Track[] = (data.tracks ?? []).filter(
        (t: Track) => !currentQ.some(q => q.id === t.id)
      );
      if (newTracks.length > 0) {
        newTracks.forEach(cacheTrack);
        const updatedQ = [...currentQ, ...newTracks];
        setQueue(updatedQ);
        return updatedQ;
      }
    } catch (err) {
      console.error('Autoplay error:', err);
    }
    return currentQ;
  }, []);

  // ── Pre-fetch up-next whenever track changes or queue is short ─
  useEffect(() => {
    if (!autoplay || !currentTrack) return;
    const tracksLeft = queue.length - currentIndex - 1;
    if (tracksLeft < 5) {
      fetchAutoplayQueue(currentTrack.id, queue);
    }
  }, [currentTrack?.id, queue.length, currentIndex, autoplay, fetchAutoplayQueue, queue]);

  // ── Dynamic color from album art ─────────────
  useEffect(() => {
    if (!currentTrack?.thumbnail) return;
    extractColor(currentTrack.thumbnail).then(rgb => {
      setDynamicRgb(rgb);
      document.documentElement.style.setProperty('--dynamic-rgb', rgb);
    });
  }, [currentTrack?.thumbnail]);

  // Applies an incoming room state (from a fresh join or a realtime update)
  // to local player state, extrapolating position from the snapshot's timestamp.
  // Compares against liveStateRef first and skips fields that already match —
  // this is what makes the echo of our own write a no-op instead of an
  // audible stutter, without needing a timing-based lock (which previously
  // caused writes made while a prior one was in flight to get dropped).
  function applyRoomSnapshot(snapshot: { queue: Track[]; currentIndex: number; isPlaying: boolean; positionSeconds: number; positionUpdatedAt: string }) {
    const live = liveStateRef.current;
    const queueChanged = snapshot.queue.length !== live.queue.length || snapshot.queue.some((t, i) => t.id !== live.queue[i]?.id);
    const indexChanged = snapshot.currentIndex !== live.currentIndex;
    const isPlayingChanged = snapshot.isPlaying !== live.isPlaying;

    const elapsed = snapshot.isPlaying ? (Date.now() - new Date(snapshot.positionUpdatedAt).getTime()) / 1000 : 0;
    const pos = snapshot.positionSeconds + elapsed;
    const positionDrifted = Math.abs(pos - live.currentTime) > 1.5;

    if (!queueChanged && !indexChanged && !isPlayingChanged && !positionDrifted) return; // pure echo of our own state

    applyingRemoteRef.current = true;
    if (queueChanged) { snapshot.queue.forEach(cacheTrack); setQueue(snapshot.queue); }
    if (indexChanged) {
      setCurrentIndex(snapshot.currentIndex);
      // A room-mate picking the track counts as this profile hearing it too.
      const t = snapshot.queue[snapshot.currentIndex];
      if (t) recordPlay(t.id);
    }
    if (isPlayingChanged) setIsPlaying(snapshot.isPlaying);
    if (indexChanged || isPlayingChanged || positionDrifted) {
      setCurrentTime(pos);
      playerRef.current.seekTo(pos);
    }
    // Left true here on purpose — the push-effect below is the only reader,
    // and it resets the flag itself the first time it observes it, right
    // after this same update's re-render. A setTimeout(0) reset raced that
    // effect instead of guaranteeing it ran first.
  }

  // Pushes local playback state to the room row. Fire-and-forget — never
  // gates on a prior push still being in flight, so rapid skips/seeks each
  // still land (the earlier timing-based lock silently dropped these).
  function pushRoomState(overrides?: Partial<{ queue: Track[]; currentIndex: number; isPlaying: boolean; positionSeconds: number }>) {
    if (!activeRoom) return;
    syncRoomRemote(activeRoom.id, {
      queue: overrides?.queue ?? queue,
      currentIndex: overrides?.currentIndex ?? currentIndex,
      isPlaying: overrides?.isPlaying ?? isPlaying,
      positionSeconds: overrides?.positionSeconds ?? currentTime,
    }).catch(() => {});
  }

  // ── Room sync: push local playback changes to the room row ──
  useEffect(() => {
    if (!activeRoom) return;
    if (applyingRemoteRef.current) { applyingRemoteRef.current = false; return; } // this render came from applyRoomSnapshot — consume the flag, don't echo it back
    pushRoomState();
    // currentTime intentionally excluded — synced explicitly on seek, not every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.id, queue, currentIndex, isPlaying]);

  // ── Room sync: mirror remote playback changes into local state ──
  useEffect(() => {
    if (!activeRoom) return;
    const supabase = createClient();
    const channel = supabase.channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${activeRoom.id}` }, payload => {
        // ponytail: temporary diagnostics for the room-sync bug (Phase 13B) —
        // remove once a live two-profile test confirms the real root cause.
        console.log('[room] UPDATE payload received:', payload.new);
        const row = payload.new as any;
        applyRoomSnapshot({
          queue: row.queue ?? [],
          currentIndex: row.current_index,
          isPlaying: row.is_playing,
          positionSeconds: row.position_seconds,
          positionUpdatedAt: row.position_updated_at,
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${activeRoom.id}` }, () => {
        setActiveRoom(null);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${activeRoom.id}` }, () => {
        // Membership changed (someone joined/left) — refresh just the member list.
        fetchRoomRemote(activeRoom.id).then(fresh => {
          if (fresh) setActiveRoom(prev => prev ? { ...prev, members: fresh.members } : prev);
        });
      })
      .subscribe(status => console.log('[room] channel status:', status));
    return () => { supabase.removeChannel(channel); };
  }, [activeRoom?.id]);

  // ── Room sync fallback: poll room state in case Realtime doesn't
  // deliver (safe to layer on top of it — applyRoomSnapshot already no-ops
  // on a pure echo of local state, so a duplicate update from both paths
  // firing is harmless). ponytail: fixed 4s interval, shorten if this turns
  // out to be the primary path rather than a fallback.
  useEffect(() => {
    if (!activeRoom) return;
    const id = setInterval(() => {
      fetchRoomRemote(activeRoom.id).then(fresh => {
        if (fresh) applyRoomSnapshot(fresh);
      });
    }, 4000);
    return () => clearInterval(id);
  }, [activeRoom?.id]);

  async function handleCreateRoom() {
    if (!activeProfile) return;
    const room = await createRoomRemote(activeProfile.id, queue, currentIndex, isPlaying, currentTime);
    if (room) { setActiveRoom(room); setShowRoomCreated(room.code); }
  }

  async function submitJoinRoom(code: string): Promise<string | void> {
    if (!activeProfile) return;
    const result = await joinRoomRemote(code, activeProfile.id);
    if ('error' in result) return result.error;
    applyRoomSnapshot(result);
    setActiveRoom(result);
    setShowJoinRoom(false);
  }

  async function handleLeaveRoom() {
    if (!activeRoom || !activeProfile) return;
    await leaveRoomRemote(activeRoom.id, activeProfile.id);
    setActiveRoom(null);
  }

  // ── Play a track ─────────────────────────────
  // Riwayat/playCounts must reflect every track that actually plays, not
  // just ones started by an explicit click — queue skip/prev, shuffle, and
  // autoplay extending the queue all land a track in front of the player
  // too, so they all have to go through this same recorder rather than only
  // the initial playTrack() call.
  const recordPlay = useCallback((trackId: string) => {
    if (!activeProfile) return;
    handleProfileChange(addRecent(activeProfile, trackId));
  }, [activeProfile]);

  const playTrack = useCallback((track: Track, newQueue: Track[]) => {
    const q = newQueue.length > 0 ? newQueue : [track];
    const idx = q.findIndex(t => t.id === track.id);
    const validIdx = idx >= 0 ? idx : 0;
    q.forEach(cacheTrack);
    setQueue(q);
    setCurrentIndex(validIdx);
    setIsPlaying(true);
    setCurrentTime(0);

    // Immediately fetch autoplay queue if queue is short
    if (q.length <= 3) {
      fetchAutoplayQueue(track.id, q);
    }

    recordPlay(track.id);
  }, [fetchAutoplayQueue, recordPlay]);

  const playIndex = useCallback((i: number) => {
    if (i < 0 || i >= queue.length) return;
    setCurrentIndex(i);
    setIsPlaying(true);
    setCurrentTime(0);
    recordPlay(queue[i].id);
  }, [queue, recordPlay]);

  async function handleNext() {
    if (queue.length === 0) return;
    if (repeat === 'one') { playerRef.current.seekTo(0); return; }
    if (shuffle) {
      const next = Math.floor(Math.random() * queue.length);
      playIndex(next);
      return;
    }
    if (currentIndex < queue.length - 1) {
      playIndex(currentIndex + 1);
    } else if (autoplay && currentTrack) {
      // Reached end of queue — fetch more recommendations and continue playing!
      const updatedQ = await fetchAutoplayQueue(currentTrack.id, queue);
      if (updatedQ.length > queue.length) {
        setCurrentIndex(currentIndex + 1);
        setIsPlaying(true);
        setCurrentTime(0);
        recordPlay(updatedQ[currentIndex + 1].id);
      } else if (repeat === 'all') {
        playIndex(0);
      } else {
        setIsPlaying(false);
      }
    } else if (repeat === 'all') {
      playIndex(0);
    } else {
      setIsPlaying(false);
    }
  }

  // Moves a queue item from one absolute index to another, keeping
  // whatever's actually playing right now playing — currentIndex has to
  // track the same track through the move, not just stay a fixed number.
  function handleReorderQueue(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setQueue(q => moveItem(q, fromIndex, toIndex));
    setCurrentIndex(ci => adjustIndexAfterMove(ci, fromIndex, toIndex));
  }

  function handlePrev() {
    if (currentTime > 3) { playerRef.current.seekTo(0); return; }
    if (currentIndex > 0) playIndex(currentIndex - 1);
    else playerRef.current.seekTo(0);
  }

  function handlePlayPause() { setIsPlaying(p => !p); }

  function handleShuffle() { setShuffle(s => !s); }

  function handleRepeat() {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off');
  }

  function handleVolume(v: number) {
    setVolume(v);
    playerRef.current.setVolume(v);
  }

  function handleSeek(s: number) {
    setCurrentTime(s);
    playerRef.current.seekTo(s);
    if (activeRoom && !applyingRemoteRef.current) {
      pushRoomState({ positionSeconds: s });
    }
  }

  function handleTimeUpdate(cur: number, dur: number) {
    setCurrentTime(cur);
    if (dur) setDuration(dur);
  }

  // Live typing in the search box — replaces the current entry in place so
  // Back/Forward isn't flooded with one history entry per keystroke, except
  // the first keystroke that actually arrives at the search tab, which is
  // itself one real navigation step.
  function handleSearchQuery(q: string) {
    if (q && activeTab !== 'search') pushNav({ tab: 'search', searchQuery: q });
    else replaceNav({ searchQuery: q });
  }

  if (showSplash || !welcomeChecked || !sessionChecked) return <Splash />;
  if (!hasSession) return <Login />;
  if (showWelcome) {
    return <Welcome onStart={() => { localStorage.setItem('mkmusic_welcomed', '1'); setShowWelcome(false); }} />;
  }

  // Show profile select screen
  if (!activeProfile) {
    return <ProfileSelect onSelect={handleProfileSelect} />;
  }

  const appClass = [
    'app',
    sidebarCollapsed ? 'collapsed' : '',
    showPanel ? 'panel-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={appClass}>
        {/* Sidebar */}
        <Sidebar
          profile={activeProfile}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onPlay={playTrack}
          queue={queue}
          currentTrack={currentTrack}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(c => !c)}
          onSwitchProfile={handleSwitchProfile}
          onShowCredits={() => setShowCredits(true)}
          onSignOut={handleSignOut}
          activeRoom={activeRoom}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={() => setShowJoinRoom(true)}
          onLeaveRoom={handleLeaveRoom}
        />

        {/* TopBar (desktop only — mobile moves search into the Search tab and account into its own tab) */}
        <TopBar onTabChange={handleTabChange} onBack={goBack} onForward={goForward} canGoBack={canGoBack} canGoForward={canGoForward} />

        {/* Main content */}
        <main className="main-content">
          {detailView?.type === 'artist' ? (
            <Artist
              artistId={detailView.id}
              profile={activeProfile}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={playTrack}
              onProfileChange={handleProfileChange}
              onAddToQueue={handleAddToQueue}
              onOpenArtist={openArtist}
              onOpenAlbum={openAlbum}
              onBack={goBack}
            />
          ) : detailView?.type === 'album' ? (
            <Album
              albumId={detailView.id}
              profile={activeProfile}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={playTrack}
              onProfileChange={handleProfileChange}
              onAddToQueue={handleAddToQueue}
              onOpenArtist={openArtist}
              onBack={goBack}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <Home
                  profile={activeProfile}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  dynamicRgb={dynamicRgb}
                  onPlay={playTrack}
                  onSearch={q => pushNav({ tab: 'search', searchQuery: q })}
                  onProfileChange={handleProfileChange}
                  onAddToQueue={handleAddToQueue}
                  onOpenArtist={openArtist}
                  onOpenAlbum={openAlbum}
                />
              )}
              {activeTab === 'search' && (
                <Search
                  query={searchQuery}
                  profile={activeProfile}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlay={playTrack}
                  onProfileChange={handleProfileChange}
                  onCategoryClick={q => pushNav({ searchQuery: q })}
                  onQueryChange={handleSearchQuery}
                  onAddToQueue={handleAddToQueue}
                  onOpenArtist={openArtist}
                  onOpenAlbum={openAlbum}
                />
              )}
              {activeTab === 'discover' && (
                <Discover
                  onPlay={playTrack}
                  onSearch={q => pushNav({ tab: 'search', searchQuery: q })}
                />
              )}
              {activeTab === 'library' && (
                <Library
                  profile={activeProfile}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlay={playTrack}
                  onProfileChange={handleProfileChange}
                  onAddToQueue={handleAddToQueue}
                  onOpenArtist={openArtist}
                />
              )}
              {activeTab === 'account' && (
                <Account
                  profile={activeProfile}
                  activeRoom={activeRoom}
                  onSwitchProfile={handleSwitchProfile}
                  onCreateRoom={handleCreateRoom}
                  onJoinRoom={() => setShowJoinRoom(true)}
                  onLeaveRoom={handleLeaveRoom}
                  onShowCredits={() => setShowCredits(true)}
                  onSignOut={handleSignOut}
                />
              )}
            </>
          )}
        </main>

        {/* Right Panel */}
        {showPanel && (
          <Queue
            queue={queue}
            currentTrack={currentTrack}
            currentIndex={currentIndex}
            profile={activeProfile}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onPlayTrack={playIndex}
            onProfileChange={handleProfileChange}
            onReorderQueue={handleReorderQueue}
            onClose={() => setShowPanel(false)}
          />
        )}

        {/* Player Bar */}
        <Player
          track={currentTrack}
          queue={queue}
          currentIndex={currentIndex}
          profile={activeProfile}
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeat={repeat}
          volume={volume}
          showQueue={showPanel}
          showExpanded={showExpanded}
          currentTime={currentTime}
          duration={duration}
          dynamicRgb={dynamicRgb}
          playerRef={playerRef}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onShuffle={handleShuffle}
          onRepeat={handleRepeat}
          onVolume={handleVolume}
          onSeek={handleSeek}
          onTimeUpdate={handleTimeUpdate}
          onTrackEnd={handleNext}
          onToggleQueue={() => setShowPanel(p => !p)}
          onToggleExpanded={() => setShowExpanded(p => !p)}
          onProfileChange={handleProfileChange}
        />
      </div>

      {showCredits && <Credits onClose={() => setShowCredits(false)} />}
      <SupportBanner />
      {showJoinRoom && <JoinRoomModal onJoin={submitJoinRoom} onClose={() => setShowJoinRoom(false)} />}
      {showRoomCreated && <RoomCreatedModal code={showRoomCreated} onClose={() => setShowRoomCreated(null)} />}

      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={activeTab} onChange={handleTabChange} />

      {/* Mobile Mini Player (above bottom nav) */}
      {currentTrack && (
        <div className="mini-player" onClick={() => setShowExpanded(true)}>
          <div className="mini-player-progress">
            <div className="mini-player-bar" style={{width: duration > 0 ? `${(currentTime/duration)*100}%` : '0%'}} />
          </div>
          <img src={currentTrack.thumbnail} alt={currentTrack.title}
            style={{width:48,height:48,borderRadius:6,objectFit:'cover',flexShrink:0}} />
          <div className="mini-track">
            <div className="mini-title">{currentTrack.title}</div>
            <div className="mini-artist">{currentTrack.artist}</div>
          </div>
          <button className="icon-btn" onClick={e => { e.stopPropagation(); handlePlayPause(); }}>
            {isPlaying
              ? <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24" style={{color:'#fff'}}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24" style={{color:'#fff'}}><polygon points="5,3 19,12 5,21"/></svg>}
          </button>
          <button className="icon-btn" onClick={e => { e.stopPropagation(); handleNext(); }}>
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" style={{color:'#fff'}}>
              <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="white" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      )}

      {/* Expanded Player */}
      {showExpanded && currentTrack && (
        <ExpandedPlayer
          track={currentTrack}
          queue={queue}
          currentIndex={currentIndex}
          profile={activeProfile}
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeat={repeat}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          dynamicRgb={dynamicRgb}
          onClose={() => setShowExpanded(false)}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onShuffle={handleShuffle}
          onRepeat={handleRepeat}
          onVolume={handleVolume}
          onSeek={handleSeek}
          onProfileChange={handleProfileChange}
          onPlayIndex={playIndex}
          onPlay={playTrack}
          onReorderQueue={handleReorderQueue}
        />
      )}
    </>
  );
}
