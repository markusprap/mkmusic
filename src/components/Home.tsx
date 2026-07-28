'use client';
import { Track, Profile, cacheTrack, getTrack, hydrateTracks } from '@/lib/store';
import { useState, useEffect, useRef, useCallback } from 'react';
import TrackMenu from './TrackMenu';
import TrackImg from './TrackImg';

const MOODS = [
  { name: 'Energik 🔥', color: '#e91e8c', query: 'energetic workout music' },
  { name: 'Santai 🌊', color: '#2196f3', query: 'chill lofi music' },
  { name: 'Fokus 🎯', color: '#9c27b0', query: 'focus study instrumental' },
  { name: 'Bahagia ☀️', color: '#ff9800', query: 'happy feel good songs' },
  { name: 'Romantis 💕', color: '#e53935', query: 'romantic love ballads' },
  { name: 'Party 🎉', color: '#ffd600', query: 'party dance hits' },
  { name: 'Tidur 🌙', color: '#37474f', query: 'sleep calm ambient' },
  { name: 'Workout 💪', color: '#00bcd4', query: 'workout gym motivation' },
];

interface HomeSection { title: string; items: HomeItem[]; eyebrow?: string; avatar?: string }
interface NewRelease {
  id: string; type: 'Single' | 'Album'; name: string; year: number | null;
  thumbnail: string; artistName: string; artistAvatar: string;
}
interface CommunityPlaylist { id: string; name: string; creator: string; count: number | null; thumbnails: string[]; tracks: Track[] }
interface HomeItem {
  type: string; id: string; videoId: string | null; playlistId: string | null;
  name: string; artist: string; artistId?: string | null; thumbnail: string;
}

function toHomeItems(tracks: Track[]): HomeItem[] {
  return tracks.slice(0, 10).map(t => ({
    type: 'SONG', id: t.id, videoId: t.id, playlistId: null, name: t.title, artist: t.artist, artistId: t.artistId ?? null, thumbnail: t.thumbnail,
  }));
}

// Desktop-only Prev/Next affordance for horizontally-scrolling rows — mobile
// relies on touch swipe (hidden there via the .scroll-arrows mobile rule).
// Each row instance owns its own ref/position, not shared state.
//
// The row element only exists once its data has loaded (rows render a
// skeleton, or nothing, until then) — a plain useRef doesn't re-run the
// measuring effect when that swap happens, so canPrev/canNext would get
// stuck at their initial `false` forever. Using state as the ref callback
// makes the DOM attachment itself the trigger: React re-invokes `setEl`
// (and therefore re-measures) exactly when the real element mounts.
function useHScroll<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, [el]);

  useEffect(() => {
    if (!el) return;
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [el, update]);

  return {
    ref: setEl, canPrev, canNext,
    scrollPrev: () => el?.scrollBy({ left: -el.clientWidth * 0.85, behavior: 'smooth' }),
    scrollNext: () => el?.scrollBy({ left: el.clientWidth * 0.85, behavior: 'smooth' }),
  };
}

function ScrollArrows({ canPrev, canNext, onPrev, onNext }: { canPrev: boolean; canNext: boolean; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="scroll-arrows">
      <button className="topbar-nav-btn" disabled={!canPrev} onClick={onPrev} title="Sebelumnya">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button className="topbar-nav-btn" disabled={!canNext} onClick={onNext} title="Selanjutnya">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

// One-off card, not a scroll row — no arrows needed for a single item.
// Clicking opens the album/single page (same as any other ALBUM-type
// HomeItem elsewhere in this file) rather than trying to play inline,
// since a "single" here is a container id (albumId/playlistId), not a
// directly-playable videoId.
function NewReleaseCard({ release, onOpenAlbum }: { release: NewRelease; onOpenAlbum: (id: string) => void }) {
  return (
    <div className="section">
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <TrackImg src={release.artistAvatar} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} />
        <h2 className="section-title">Baru dari {release.artistName}</h2>
      </div>
      <div className="card" style={{display:'flex',alignItems:'stretch',cursor:'pointer',overflow:'hidden',borderRadius:8,background:'rgba(255,255,255,.06)',maxWidth:520}}
        onClick={()=>onOpenAlbum(release.id)}>
        <div style={{flex:1,minWidth:0,padding:'20px 24px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <div>
            <div className="card-title" style={{fontSize:18,marginBottom:6}}>{release.name}</div>
            <div className="card-sub">{release.type}{release.year ? ` • ${release.year}` : ''}</div>
          </div>
          <button className="play-btn" style={{width:44,height:44,alignSelf:'flex-start',marginTop:16,border:'none',cursor:'pointer'}}
            onClick={e=>{e.stopPropagation();onOpenAlbum(release.id);}}>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
          </button>
        </div>
        <TrackImg src={release.thumbnail} alt={release.name} style={{width:180,height:180,objectFit:'cover',flexShrink:0}}/>
      </div>
    </div>
  );
}

function TrackRow({ title, tracks, profile, onPlay, onProfileChange, onAddToQueue, wide }: {
  title: string; tracks: Track[]; profile: Profile;
  onPlay: (t: Track, queue: Track[]) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  wide?: boolean;
}) {
  const { ref, canPrev, canNext, scrollPrev, scrollNext } = useHScroll<HTMLDivElement>();
  if (tracks.length === 0) return null;
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {wide && <button className="btn-outline" style={{ padding: '6px 18px', fontSize: 13 }} onClick={() => onPlay(tracks[0], tracks)}>Putar Semua</button>}
          <ScrollArrows canPrev={canPrev} canNext={canNext} onPrev={scrollPrev} onNext={scrollNext} />
        </div>
      </div>
      <div ref={ref} className="scroll-row" style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8}}>
        {tracks.map(t=>(
          <div key={t.id} className="card" style={{width: wide ? 260 : 180,flexShrink:0}} onClick={()=>onPlay(t,tracks)}>
            <div className={`card-img-wrap${wide ? ' wide' : ''}`}>
              <TrackImg src={t.thumbnail} alt={t.title}/>
              <div className="card-play"><svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            </div>
            <TrackMenu className="card-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
            <div className="card-title">{t.title}</div>
            <div className="card-sub">{t.artist}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeSectionRow({ section, profile, onProfileChange, onAddToQueue, playHomeItem }: {
  section: HomeSection; profile: Profile;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  playHomeItem: (item: HomeItem, allItems: HomeItem[]) => void;
}) {
  const { ref, canPrev, canNext, scrollPrev, scrollNext } = useHScroll<HTMLDivElement>();
  return (
    <div className="section">
      <div className="section-header">
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
          {section.avatar && <TrackImg src={section.avatar} alt="" style={{width:32,height:32,borderRadius:'50%',flexShrink:0,objectFit:'cover'}} />}
          <div style={{minWidth:0}}>
            {section.eyebrow && <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--text-2)',textTransform:'uppercase'}}>{section.eyebrow}</div>}
            <h2 className="section-title">{section.title}</h2>
          </div>
        </div>
        <ScrollArrows canPrev={canPrev} canNext={canNext} onPrev={scrollPrev} onNext={scrollNext} />
      </div>
      <div ref={ref} className="scroll-row" style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8}}>
        {section.items.map((item, ii) => (
          <div key={item.id+ii} className="card" style={{width:180,flexShrink:0}}
            onClick={()=>playHomeItem(item, section.items)}>
            <div className={`card-img-wrap ${item.type==='ARTIST'?'circle':''}`}>
              <TrackImg src={item.thumbnail} alt={item.name} retrySrc={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} />
              <div className="card-play"><svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            </div>
            {item.videoId && (
              <TrackMenu className="card-menu" profile={profile} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue}
                track={{ id: item.videoId, title: item.name, artist: item.artist, thumbnail: item.thumbnail, duration: 0 }} />
            )}
            <div className="card-title">{item.name}</div>
            <div className="card-sub">{item.type==='ARTIST'?'Artis':item.type==='PLAYLIST'?'Playlist':item.artist}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Big full-bleed hero cards for "Rekomendasi harian Anda" — the gradient
// (not the image) is what guarantees the overlaid text stays legible, since
// thumbnails range from very dark to very light. No view-count/description
// line: ytmusic-api carries neither, so neither gets faked.
function HeroTrackRow({ title, tracks, profile, onPlay, onProfileChange, onAddToQueue }: {
  title: string; tracks: Track[]; profile: Profile;
  onPlay: (t: Track, queue: Track[]) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
}) {
  const { ref, canPrev, canNext, scrollPrev, scrollNext } = useHScroll<HTMLDivElement>();
  if (tracks.length === 0) return null;
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-outline" style={{ padding: '6px 18px', fontSize: 13 }} onClick={() => onPlay(tracks[0], tracks)}>Putar Semua</button>
          <ScrollArrows canPrev={canPrev} canNext={canNext} onPrev={scrollPrev} onNext={scrollNext} />
        </div>
      </div>
      <div ref={ref} className="scroll-row" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {tracks.map(t => (
          <div key={t.id} className="hero-card" style={{ backgroundImage: `url(${t.thumbnail})` }} onClick={() => onPlay(t, tracks)}>
            <div className="hero-card-overlay">
              <div className="hero-card-title">{t.title}</div>
              <div className="hero-card-sub">{t.artist}</div>
            </div>
            <TrackMenu className="card-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
          </div>
        ))}
      </div>
    </div>
  );
}

// The 2x2 photo collage only exists once each card's own /api/playlist call
// resolves — until then it falls back to the single flat thumbnail already
// known from search, upgrading in place when the real data arrives.
function CommunityPlaylistRow({ playlists, profile, onPlay, onSearch, onProfileChange, onAddToQueue }: {
  playlists: CommunityPlaylist[]; profile: Profile;
  onPlay: (t: Track, queue: Track[]) => void;
  onSearch: (q: string) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
}) {
  const { ref, canPrev, canNext, scrollPrev, scrollNext } = useHScroll<HTMLDivElement>();
  if (playlists.length === 0) return null;
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Dari Komunitas</h2>
        <ScrollArrows canPrev={canPrev} canNext={canNext} onPrev={scrollPrev} onNext={scrollNext} />
      </div>
      <div ref={ref} className="scroll-row" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {playlists.map(p => (
          <div key={p.id} className="community-card" style={{ width: 340, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, cursor: 'pointer' }} onClick={() => onSearch(p.name)}>
              <div className="card-img-wrap" style={{
                width: 90, height: 90, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
                display: p.thumbnails.length > 1 ? 'grid' : 'block',
                gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
              }}>
                {p.thumbnails.length > 1
                  ? p.thumbnails.slice(0, 4).map((src, i) => <TrackImg key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)
                  : <TrackImg src={p.thumbnails[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="card-title" style={{ fontSize: 16 }}>{p.name}</div>
                <div className="card-sub">{p.creator}</div>
                {p.count != null && <div className="card-sub">{p.count} lagu</div>}
              </div>
            </div>
            {p.tracks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {p.tracks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onPlay(t, p.tracks)}>
                    <TrackImg src={t.thumbnail} alt={t.title} style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{t.artist}</div>
                    </div>
                    <TrackMenu className="quick-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
                  </div>
                ))}
                <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, alignSelf: 'flex-start' }}
                  onClick={() => onPlay(p.tracks[0], p.tracks)}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
                  Putar Playlist
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  profile: Profile;
  currentTrack: Track | null;
  isPlaying: boolean;
  dynamicRgb: string;
  onPlay: (t: Track, queue: Track[]) => void;
  onSearch: (q: string) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  onOpenArtist: (id: string) => void;
  onOpenAlbum: (id: string) => void;
}

export default function Home({ profile, currentTrack, isPlaying, dynamicRgb, onPlay, onSearch, onProfileChange, onAddToQueue, onOpenArtist, onOpenAlbum }: Props) {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [forYou, setForYou] = useState<Track[]>([]);
  const [oldFavorites, setOldFavorites] = useState<Track[]>([]);
  const [newRelease, setNewRelease] = useState<NewRelease | null>(null);
  const [communityPlaylists, setCommunityPlaylists] = useState<CommunityPlaylist[]>([]);
  const [dailyPicks, setDailyPicks] = useState<Track[]>([]);
  const [videoPicks, setVideoPicks] = useState<Track[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingQuick, setLoadingQuick] = useState(true);
  const fetched = useRef(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';

  const fetchHome = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;

    // Personalize off this profile's own listening: most recent like, then
    // most recent play — YouTube's "related videos" for those tracks stands
    // in for a recommendation engine, no ML backend to plug in here.
    const likedSeed = profile.likedIds[profile.likedIds.length - 1];
    const recentSeed = (profile.recentIds || []).find(id => id !== likedSeed);
    const quickSeed = likedSeed ?? recentSeed;
    // Any cached track for those seeds may carry an artistId (search/home/
    // upnext results all set it) — reuse it as a fallback taste seed for
    // profiles with too little playCounts history yet to rank artists below.
    const artistSeed = getTrack(quickSeed ?? '')?.artistId || getTrack(recentSeed ?? '')?.artistId;

    // Rank favorite artists by aggregated playCounts (needs each track's
    // artistId, hydrated up front) — artist #2, not #1, seeds "Mirip dengan"
    // so it stays distinct from whichever artist a future "Baru dari
    // {Artist}" section ends up using for the #1 slot.
    const playedTrackIds = Object.keys(profile.playCounts || {});
    await hydrateTracks(playedTrackIds);
    const artistTotals = new Map<string, { name: string; count: number }>();
    for (const id of playedTrackIds) {
      const t = getTrack(id);
      if (!t?.artistId) continue;
      const cur = artistTotals.get(t.artistId);
      artistTotals.set(t.artistId, { name: t.artist, count: (cur?.count ?? 0) + profile.playCounts[id] });
    }
    const favoriteArtistIds = [...artistTotals.entries()].sort((a, b) => b[1].count - a[1].count).map(([id]) => id);
    const similarSeed = favoriteArtistIds[1] ?? favoriteArtistIds[0] ?? artistSeed;
    const newReleaseSeed = favoriteArtistIds[0];

    const [homeRes, quickRes, forYouRes, similarRes, chartRes, dangdutRes, newReleaseRes, videoRes] = await Promise.allSettled([
      fetch('/api/home').then(r => r.json()),
      fetch(quickSeed ? `/api/upnext?videoId=${quickSeed}` : '/api/search?q=top+hits+indonesia+2024').then(r => r.json()),
      recentSeed && recentSeed !== quickSeed
        ? fetch(`/api/upnext?videoId=${recentSeed}`).then(r => r.json())
        : Promise.resolve({ tracks: [] }),
      similarSeed ? fetch(`/api/artist?id=${similarSeed}`).then(r => r.json()) : Promise.resolve(null),
      fetch('/api/search?q=' + encodeURIComponent('top 50 global hits 2024')).then(r => r.json()),
      fetch('/api/search?q=' + encodeURIComponent('dangdut koplo')).then(r => r.json()),
      newReleaseSeed ? fetch(`/api/artist?id=${newReleaseSeed}`).then(r => r.json()) : Promise.resolve(null),
      fetch('/api/videos?q=' + encodeURIComponent('official music video')).then(r => r.json()),
    ]);

    // Baru dari {Artist}: newest of that artist's topSingles[0]/topAlbums[0]
    // by year — topSingles comes back newest-first already (confirmed live
    // against a real artist), topAlbums does not, so compare years rather
    // than trusting either array's order outright. Year-only, since
    // ytmusic-api has no day/month precision anywhere to show "Single • 25 Jul" honestly.
    if (newReleaseRes.status === 'fulfilled' && newReleaseRes.value?.artist) {
      const a = newReleaseRes.value.artist;
      const latestSingle = a.topSingles?.[0] ? { ...a.topSingles[0], kind: 'Single' as const } : null;
      const latestAlbum = a.topAlbums?.[0] ? { ...a.topAlbums[0], kind: 'Album' as const } : null;
      const latest = [latestSingle, latestAlbum]
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((x, y) => (y.year ?? 0) - (x.year ?? 0))[0];
      if (latest) {
        setNewRelease({
          id: latest.id, type: latest.kind, name: latest.name, year: latest.year,
          thumbnail: latest.thumbnail, artistName: a.name, artistAvatar: a.thumbnail,
        });
      }
    }

    const extraSections: HomeSection[] = [];
    const seedArtist = similarRes.status === 'fulfilled' ? similarRes.value?.artist : null;
    if (seedArtist?.similarArtists?.length) {
      // ytmusic-api's "similarArtists" field is actually the artist's related
      // radio/playlist shelf (IDs come back as playlist IDs, not channel
      // IDs) — surfaced as playlists, not artist cards, to match what it is.
      extraSections.push({
        title: seedArtist.name,
        eyebrow: 'MIRIP DENGAN',
        avatar: seedArtist.thumbnail,
        items: seedArtist.similarArtists.slice(0, 10).map((a: any) => ({
          type: 'PLAYLIST', id: a.id, videoId: null, playlistId: a.id, name: a.name, artist: '', artistId: null, thumbnail: a.thumbnail,
        })),
      });
    }
    if (chartRes.status === 'fulfilled' && chartRes.value?.tracks?.length) {
      extraSections.push({ title: 'Chart Global', items: toHomeItems(chartRes.value.tracks) });
    }
    if (dangdutRes.status === 'fulfilled' && dangdutRes.value?.tracks?.length) {
      extraSections.push({ title: 'Dangdut', items: toHomeItems(dangdutRes.value.tracks) });
    }
    // Playlist unggulan untuk Anda: dangdutRes's `.playlists` field has been
    // fetched every load (same /api/search call built for the "Dangdut"
    // track section above) but never read — same free-reuse trick as
    // "Playlist trending komunitas" below, just a different already-fetched query.
    if (dangdutRes.status === 'fulfilled' && dangdutRes.value?.playlists?.length) {
      extraSections.push({
        title: 'Playlist unggulan untuk Anda',
        items: dangdutRes.value.playlists.slice(0, 10).map((p: any) => ({
          type: 'PLAYLIST', id: p.id, videoId: null, playlistId: p.id, name: p.name, artist: p.artist ?? '', artistId: null, thumbnail: p.thumbnail,
        })),
      });
    }
    const realSections = homeRes.status === 'fulfilled' ? (homeRes.value.sections ?? []) : [];
    setSections([...realSections, ...extraSections]);
    setLoadingHome(false);

    // Playlist trending komunitas: /api/search already returns real
    // community-made playlists for free (the `.playlists` field alongside
    // tracks/artists/albums), so the row appears immediately with each
    // playlist's single flat thumbnail. The real 2x2 collage + song count
    // then comes from a per-playlist /api/playlist call — fired after the
    // row is already visible (not awaited here) so a slow/failed call for
    // one card never blocks the others or the rest of the page.
    const rawCommunity = chartRes.status === 'fulfilled' ? (chartRes.value?.playlists ?? []).slice(0, 20) : [];
    if (rawCommunity.length) {
      setCommunityPlaylists(rawCommunity.map((p: any) => ({
        id: p.id, name: p.name, creator: p.artist ?? '', count: null, thumbnails: [p.thumbnail], tracks: [],
      })));
      Promise.allSettled(
        rawCommunity.map((p: any) => fetch(`/api/playlist?id=${p.id}`).then(r => r.json()))
      ).then(results => {
        setCommunityPlaylists(prev => prev.map((cp, i) => {
          const r = results[i];
          if (r.status !== 'fulfilled' || !r.value?.thumbnails?.length) return cp;
          const tracks: Track[] = r.value.tracks ?? [];
          tracks.forEach(cacheTrack);
          return { ...cp, count: r.value.count, thumbnails: r.value.thumbnails, tracks };
        }));
      });
    }

    // Forgotten favorites: older likes the profile hasn't replayed recently —
    // same resurfacing idea as YT Music's own "Forgotten favorites" shelf,
    // built entirely from data we already store (no extra recommendation logic).
    const skip = new Set([likedSeed, recentSeed, ...(profile.recentIds || []).slice(0, 10)]);
    const oldLikedIds = profile.likedIds.filter(id => !skip.has(id)).slice(0, 10);
    if (oldLikedIds.length > 0) {
      await hydrateTracks(oldLikedIds);
      setOldFavorites(oldLikedIds.map(id => getTrack(id)).filter(Boolean) as Track[]);
    }

    // Pilihan Cepat: blend disukai (liked) + sering diputar (playCounts) +
    // terkait (upnext radio) + pilihan (chart) into one pool, deduped and
    // capped at 40 (4 rows x up to 10 columns) — mirrors YT Music's own
    // "Quick picks" shelf, which mixes several recommendation kinds together
    // rather than showing one radio mix.
    const likedPoolIds = [...profile.likedIds].reverse().slice(0, 10);
    const frequentPoolIds = Object.entries(profile.playCounts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);
    await hydrateTracks([...likedPoolIds, ...frequentPoolIds]);

    const relatedTracks: Track[] = quickRes.status === 'fulfilled' ? (quickRes.value.tracks ?? []) : [];
    relatedTracks.forEach(cacheTrack);
    const pickedTracks: Track[] = chartRes.status === 'fulfilled' ? (chartRes.value.tracks ?? []) : [];

    const seenQuick = new Set<string>();
    const quickPool: Track[] = [];
    const addToPool = (t: Track | undefined) => { if (t && !seenQuick.has(t.id)) { seenQuick.add(t.id); quickPool.push(t); } };
    [...likedPoolIds, ...frequentPoolIds].forEach(id => addToPool(getTrack(id)));
    relatedTracks.slice(0, 15).forEach(addToPool);
    pickedTracks.slice(0, 10).forEach(addToPool);
    setQuickPicks(quickPool.slice(0, 40));
    setLoadingQuick(false);

    // Rekomendasi harian Anda: chartRes.tracks can return up to 40 items —
    // index 0-9 already went to "Chart Global"/the Pilihan Cepat "pilihan"
    // bucket above, so 10-20 has been sitting fetched-but-unread this whole time.
    setDailyPicks(pickedTracks.slice(10, 20));

    if (forYouRes.status === 'fulfilled') {
      const tracks: Track[] = forYouRes.value.tracks ?? [];
      tracks.forEach(cacheTrack);
      setForYou(tracks.slice(0, 10));
    }

    if (videoRes.status === 'fulfilled' && videoRes.value?.tracks?.length) {
      const tracks: Track[] = videoRes.value.tracks;
      tracks.forEach(cacheTrack);
      setVideoPicks(tracks);
    }
  }, [profile.likedIds, profile.recentIds, profile.playCounts]);

  useEffect(() => { fetchHome(); }, [fetchHome]);

  // Convert HomeItem to Track and play
  function playHomeItem(item: HomeItem, allItems: HomeItem[]) {
    if (!item.videoId) {
      if (item.type === 'ARTIST') onOpenArtist(item.id);
      else if (item.type === 'ALBUM') onOpenAlbum(item.id);
      else onSearch(item.name);
      return;
    }
    const track: Track = {
      id: item.videoId,
      title: item.name,
      artist: item.artist,
      thumbnail: item.thumbnail,
      duration: 0,
    };
    cacheTrack(track);
    const queue: Track[] = allItems
      .filter(i => i.videoId)
      .map(i => ({ id: i.videoId!, title: i.name, artist: i.artist, thumbnail: i.thumbnail, duration: 0 }));
    queue.forEach(cacheTrack);
    onPlay(track, queue.length > 0 ? queue : [track]);
  }

  const recentTracks = (profile?.recentIds || []).slice(0, 6).map(id => getTrack(id)).filter(Boolean) as Track[];
  const quickScroll = useHScroll<HTMLDivElement>();

  const SkeletonCard = () => (
    <div className="skeleton-card" style={{padding:16}}>
      <div className="skeleton sk-img" style={{aspectRatio:1,borderRadius:8,marginBottom:12}}/>
      <div className="skeleton" style={{height:14,borderRadius:3,marginBottom:6}}/>
      <div className="skeleton" style={{height:12,borderRadius:3,width:'65%'}}/>
    </div>
  );

  return (
    <div className="main-content-inner animate-in">
      {/* Hero + Quick picks */}
      <div className="page-header-gradient">
        <div className="page-header-gradient-bg"
          style={{background:`linear-gradient(180deg,rgba(${dynamicRgb},.35) 0%,#121212 100%)`}}/>
        <h1 style={{fontSize:'clamp(26px,4vw,40px)',fontWeight:900,marginBottom:16}}>{greeting}, {profile.name} 👋</h1>

        <div className="mood-chip-row">
          {MOODS.map(m=>(
            <button key={m.name} className="mood-chip" style={{background:m.color}} onClick={()=>onSearch(m.query)}>
              {m.name}
            </button>
          ))}
        </div>

        <div className="section-header" style={{marginBottom:12}}>
          <h2 className="section-title">Pilihan Cepat</h2>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {quickPicks.length > 0 && (
              <button className="btn-outline" style={{padding:'6px 18px',fontSize:13}} onClick={()=>onPlay(quickPicks[0], quickPicks)}>Putar Semua</button>
            )}
            <ScrollArrows canPrev={quickScroll.canPrev} canNext={quickScroll.canNext} onPrev={quickScroll.scrollPrev} onNext={quickScroll.scrollNext} />
          </div>
        </div>
        {loadingQuick ? (
          <div className="quick-grid">
            {Array(12).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:60,borderRadius:6}}/>)}
          </div>
        ) : (
          <div ref={quickScroll.ref} className="quick-grid">
            {quickPicks.map(t=>(
              <div key={t.id} className="quick-card" onClick={()=>onPlay(t, quickPicks)}>
                <TrackImg src={t.thumbnail} alt={t.title}/>
                <div className="quick-info">
                  <span className="quick-name">{t.title}</span>
                  <span className="quick-sub">{t.artist}</span>
                </div>
                <TrackMenu className="quick-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
              </div>
            ))}
          </div>
        )}
      </div>

      {newRelease && <NewReleaseCard release={newRelease} onOpenAlbum={onOpenAlbum} />}

      <TrackRow title="Baru Diputar" tracks={recentTracks} profile={profile} onPlay={onPlay} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
      <TrackRow title="Untuk Kamu" tracks={forYou} profile={profile} onPlay={onPlay} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
      <TrackRow title="Favorit Lama" tracks={oldFavorites} profile={profile} onPlay={onPlay} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
      <CommunityPlaylistRow playlists={communityPlaylists} profile={profile} onPlay={onPlay} onSearch={onSearch} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
      <HeroTrackRow title="Rekomendasi harian Anda" tracks={dailyPicks} profile={profile} onPlay={onPlay} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
      <TrackRow wide title="Video musik untuk Anda" tracks={videoPicks} profile={profile} onPlay={onPlay} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />

      {/* Real YTMusic home sections */}
      {loadingHome ? (
        <div className="section">
          <div className="section-header"><h2 className="section-title">Rekomendasi</h2></div>
          <div className="card-grid">{Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)}</div>
        </div>
      ) : sections.map((section, si) => (
        <HomeSectionRow key={si} section={section} profile={profile}
          onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} playHomeItem={playHomeItem} />
      ))}
    </div>
  );
}
