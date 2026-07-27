'use client';
import { Track, Profile, cacheTrack, getTrack } from '@/lib/store';
import { useState, useEffect, useRef, useCallback } from 'react';
import TrackMenu from './TrackMenu';

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

interface HomeSection { title: string; items: HomeItem[] }
interface HomeItem {
  type: string; id: string; videoId: string | null; playlistId: string | null;
  name: string; artist: string; artistId?: string | null; thumbnail: string;
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

    const [homeRes, quickRes, forYouRes] = await Promise.allSettled([
      fetch('/api/home').then(r => r.json()),
      fetch(quickSeed ? `/api/upnext?videoId=${quickSeed}` : '/api/search?q=top+hits+indonesia+2024').then(r => r.json()),
      recentSeed && recentSeed !== quickSeed
        ? fetch(`/api/upnext?videoId=${recentSeed}`).then(r => r.json())
        : Promise.resolve({ tracks: [] }),
    ]);

    if (homeRes.status === 'fulfilled') {
      setSections(homeRes.value.sections ?? []);
    }
    setLoadingHome(false);

    if (quickRes.status === 'fulfilled') {
      const tracks: Track[] = quickRes.value.tracks ?? [];
      tracks.forEach(cacheTrack);
      setQuickPicks(tracks.slice(0, 8));
    }
    setLoadingQuick(false);

    if (forYouRes.status === 'fulfilled') {
      const tracks: Track[] = forYouRes.value.tracks ?? [];
      tracks.forEach(cacheTrack);
      setForYou(tracks.slice(0, 10));
    }
  }, [profile.likedIds, profile.recentIds]);

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

        <h2 className="section-title" style={{marginBottom:12}}>Pilihan Cepat</h2>
        {loadingQuick ? (
          <div className="quick-grid">
            {Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:60,borderRadius:6}}/>)}
          </div>
        ) : (
          <div className="quick-grid">
            {quickPicks.map(t=>(
              <div key={t.id} className="quick-card" onClick={()=>onPlay(t, quickPicks)}>
                <img src={t.thumbnail} alt={t.title}/>
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

      {/* Recently played */}
      {recentTracks.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Baru Diputar</h2>
          </div>
          <div className="scroll-row" style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8}}>
            {recentTracks.map(t=>(
              <div key={t.id} className="card" style={{width:180,flexShrink:0}} onClick={()=>onPlay(t,recentTracks)}>
                <div className="card-img-wrap">
                  <img src={t.thumbnail} alt={t.title}/>
                  <div className="card-play"><svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
                </div>
                <TrackMenu className="card-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
                <div className="card-title">{t.title}</div>
                <div className="card-sub">{t.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized picks, off this profile's own recent plays */}
      {forYou.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Untuk Kamu</h2>
          </div>
          <div className="scroll-row" style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8}}>
            {forYou.map(t=>(
              <div key={t.id} className="card" style={{width:180,flexShrink:0}} onClick={()=>onPlay(t,forYou)}>
                <div className="card-img-wrap">
                  <img src={t.thumbnail} alt={t.title}/>
                  <div className="card-play"><svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
                </div>
                <TrackMenu className="card-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
                <div className="card-title">{t.title}</div>
                <div className="card-sub">{t.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real YTMusic home sections */}
      {loadingHome ? (
        <div className="section">
          <div className="section-header"><h2 className="section-title">Rekomendasi</h2></div>
          <div className="card-grid">{Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)}</div>
        </div>
      ) : sections.map((section, si) => (
        <div key={si} className="section">
          <div className="section-header">
            <h2 className="section-title">{section.title}</h2>
          </div>
          <div className="scroll-row" style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8}}>
            {section.items.map((item, ii) => (
              <div key={item.id+ii} className="card" style={{width:180,flexShrink:0}}
                onClick={()=>playHomeItem(item, section.items)}>
                <div className={`card-img-wrap ${item.type==='ARTIST'?'circle':''}`}>
                  <img src={item.thumbnail} alt={item.name}
                    onError={e=>(e.currentTarget.src=`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`)}/>
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
      ))}
    </div>
  );
}
