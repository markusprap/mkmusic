'use client';
import { Track, Profile, Playlist, getTrack, toggleLike, createPlaylist, removeFromPlaylist, formatDuration } from '@/lib/store';
import { useState } from 'react';
import TrackMenu from './TrackMenu';
import NamePromptModal from './NamePromptModal';

type LibTab = 'songs' | 'playlists' | 'artists';

interface Props {
  profile: Profile;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: (t: Track, queue: Track[]) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
  onOpenArtist: (id: string) => void;
}

export default function Library({ profile, currentTrack, isPlaying, onPlay, onProfileChange, onAddToQueue, onOpenArtist }: Props) {
  const [tab, setTab] = useState<LibTab>('songs');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  const likedIds = profile?.likedIds || [];
  const playlists = profile?.playlists || [];

  const likedTracks = likedIds.map(id => getTrack(id)).filter(Boolean) as Track[];

  const liked = (id: string) => likedIds.includes(id);

  function handleLike(e: React.MouseEvent, t: Track) {
    e.stopPropagation();
    onProfileChange(toggleLike(profile, t.id));
  }

  const artists = [...new Map(likedTracks.map(t => [t.artist, t])).values()];

  function handleCreatePlaylist() {
    setShowCreatePlaylist(true);
  }

  function submitCreatePlaylist(name: string) {
    const { profile: updated } = createPlaylist(profile, name);
    onProfileChange(updated);
    setShowCreatePlaylist(false);
  }

  function handleRemoveFromPlaylist(trackId: string) {
    if (!selectedPlaylist) return;
    const updated = removeFromPlaylist(profile, selectedPlaylist.id, trackId);
    onProfileChange(updated);
    setSelectedPlaylist(updated.playlists.find(p => p.id === selectedPlaylist.id) ?? null);
  }

  // Playlist detail view
  if (selectedPlaylist) {
    const livePlaylist = playlists.find(p => p.id === selectedPlaylist.id) ?? selectedPlaylist;
    const plTracks = livePlaylist.trackIds.map(id => getTrack(id)).filter(Boolean) as Track[];
    return (
      <div className="main-content-inner animate-in">
        <div className="page-header-gradient">
          <div className="page-header-gradient-bg" style={{background:'linear-gradient(180deg,rgba(100,65,165,.35) 0%,#121212 100%)'}} />
          <button className="icon-btn" onClick={() => setSelectedPlaylist(null)} style={{marginBottom:16}} title="Kembali">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:900,marginBottom:6}}>{livePlaylist.name}</h1>
          <p style={{color:'#b3b3b3',fontSize:14}}>{plTracks.length} lagu</p>
        </div>
        <div className="section" style={{marginTop:16}}>
          {plTracks.length === 0 ? (
            <p style={{color:'#b3b3b3',textAlign:'center',padding:'60px 0'}}>Playlist ini masih kosong</p>
          ) : (
            <div className="track-list">
              {plTracks.map((t, i) => {
                const isActive = currentTrack?.id === t.id;
                return (
                  <div key={t.id} className={`track-row ${isActive?'is-active':''}`} onClick={() => onPlay(t, plTracks)}>
                    <div className="track-num-cell">{isActive&&isPlaying?<div className="eq"><span/><span/><span/></div>:i+1}</div>
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
                    <button className="track-like icon-btn" title="Hapus dari playlist" onClick={e => { e.stopPropagation(); handleRemoveFromPlaylist(t.id); }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <TrackMenu className="track-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
                    <div className="track-dur">{formatDuration(t.duration)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-inner animate-in">
      <div className="page-header-gradient">
        <div className="page-header-gradient-bg" style={{background:'linear-gradient(180deg,rgba(100,65,165,.35) 0%,#121212 100%)'}} />
        <h1 style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:900,marginBottom:6}}>Koleksi Kamu</h1>
        <p style={{color:'#b3b3b3',fontSize:14}}>{likedIds.length} lagu disukai · {playlists.length} playlist</p>
      </div>

      {/* Tabs */}
      <div className="lib-tabs-row">
        <div className="search-result-tabs" style={{flex:1}}>
          {(['songs','playlists','artists'] as LibTab[]).map(t => (
            <button key={t} className={`search-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
              {t==='songs'?'Lagu Disukai':t==='playlists'?'Playlist':'Artis'}
            </button>
          ))}
        </div>
        {tab === 'playlists' && (
          <button className="btn-outline" onClick={handleCreatePlaylist} style={{marginBottom:12,whiteSpace:'nowrap'}}>
            + Playlist Baru
          </button>
        )}
      </div>

      {/* Liked Songs */}
      {tab === 'songs' && (
        <div className="section" style={{marginTop:16}}>
          {likedTracks.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 0',color:'#b3b3b3'}}>
              <svg width="64" height="64" fill="none" stroke="#b3b3b3" strokeWidth="1.5" viewBox="0 0 24 24" style={{margin:'0 auto 16px'}}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <p style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:8}}>Belum ada lagu disukai</p>
              <p>Klik ♥ pada lagu manapun untuk menyimpannya di sini</p>
            </div>
          ) : (
            <div className="track-list">
              {likedTracks.map((t, i) => {
                const isActive = currentTrack?.id === t.id;
                return (
                  <div key={t.id} className={`track-row ${isActive?'is-active':''}`} onClick={() => onPlay(t, likedTracks)}>
                    <div className="track-num-cell">{isActive&&isPlaying?<div className="eq"><span/><span/><span/></div>:i+1}</div>
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
                    <TrackMenu className="track-menu" profile={profile} track={t} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
                    <div className="track-dur">{formatDuration(t.duration)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Playlists */}
      {tab === 'playlists' && (
        <div className="section" style={{marginTop:16}}>
          {playlists.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 0',color:'#b3b3b3'}}>
              <svg width="64" height="64" fill="none" stroke="#b3b3b3" strokeWidth="1.5" viewBox="0 0 24 24" style={{margin:'0 auto 16px'}}>
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <p style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:8}}>Belum ada playlist</p>
              <p>Klik &quot;+ Playlist Baru&quot; di atas untuk membuat playlist pertamamu</p>
            </div>
          ) : (
            <div className="card-grid">
              {playlists.map(pl => {
                const cover = pl.trackIds.map(id=>getTrack(id)).find(Boolean);
                return (
                  <div key={pl.id} className="card" onClick={() => setSelectedPlaylist(pl)}>
                    <div className="card-img-wrap">
                      {cover ? <img src={cover.thumbnail} alt={pl.name} /> : <div style={{width:'100%',height:'100%',background:'#282828',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg width="40" height="40" fill="none" stroke="#b3b3b3" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                      </div>}
                      <div className="card-play"><svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
                    </div>
                    <div className="card-title">{pl.name}</div>
                    <div className="card-sub">{pl.trackIds.length} lagu</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Artists */}
      {tab === 'artists' && (
        <div className="section" style={{marginTop:16}}>
          {artists.length === 0 ? (
            <p style={{color:'#b3b3b3',textAlign:'center',padding:'60px 0'}}>Sukai lagu dulu untuk melihat artis favorit kamu</p>
          ) : (
            <div className="card-grid">
              {artists.map(t => (
                <div key={t.artist} className="card" onClick={() => t.artistId && onOpenArtist(t.artistId)}>
                  <div className="card-img-wrap circle">
                    <img src={t.thumbnail} alt={t.artist} />
                    <div className="card-play"><svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
                  </div>
                  <div className="card-title" style={{textAlign:'center'}}>{t.artist}</div>
                  <div className="card-sub" style={{textAlign:'center'}}>Artis</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreatePlaylist && (
        <NamePromptModal title="Playlist Baru" placeholder="Nama playlist"
          onSubmit={submitCreatePlaylist} onClose={() => setShowCreatePlaylist(false)} />
      )}
    </div>
  );
}
