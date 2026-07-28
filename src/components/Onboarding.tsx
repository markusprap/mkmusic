'use client';
import { useState } from 'react';
import { Profile, Track, cacheTrack, syncProfile } from '@/lib/store';
import { screenStyle } from './ProfileSelect';

const GENRES = ['Pop', 'Dangdut', 'Hip-Hop', 'R&B', 'Rock', 'Indie', 'EDM', 'Jazz', 'Religi', 'Reggae'];

interface ArtistPick { id: string; name: string; thumbnail: string }
interface Props { profile: Profile; onDone: (profile: Profile) => void }

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter(x => x !== id) : [...list, id];
}

export default function Onboarding({ profile, onDone }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [artists, setArtists] = useState<ArtistPick[]>([]);
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackIds, setTrackIds] = useState<string[]>([]);

  async function finish(likedIds: string[]) {
    const updated = { ...profile, likedIds };
    await syncProfile(updated);
    onDone(updated);
  }

  // Falls back down the chain (picked songs > artist's top songs > genre
  // search results > generic home) so skipping a step never zeroes out the
  // signal gathered so far — the profile's home feed must never end up empty.
  function finishUsing(pool: Track[]) {
    return finish(pool.slice(0, 10).map(t => t.id));
  }

  async function fetchGenreArtistsAndTracks(): Promise<{ artists: ArtistPick[]; tracks: Track[] }> {
    const results = await Promise.all(
      genres.map(g => fetch(`/api/search?q=${encodeURIComponent(g)}`).then(r => r.json()).catch(() => ({ artists: [], tracks: [] })))
    );
    const seenA = new Set<string>(), pickedArtists: ArtistPick[] = [];
    const seenT = new Set<string>(), pickedTracks: Track[] = [];
    for (const r of results) {
      for (const a of (r.artists ?? [])) { if (!seenA.has(a.id)) { seenA.add(a.id); pickedArtists.push(a); } }
      for (const t of (r.tracks ?? [])) { if (!seenT.has(t.id)) { seenT.add(t.id); pickedTracks.push(t); } }
    }
    pickedTracks.forEach(cacheTrack);
    return { artists: pickedArtists.slice(0, 24), tracks: pickedTracks };
  }

  async function toStep2() {
    if (genres.length === 0) return finish([]);
    setLoading(true);
    const { artists: foundArtists, tracks: foundTracks } = await fetchGenreArtistsAndTracks();
    setGenreTracks(foundTracks);
    setLoading(false);
    if (foundArtists.length === 0) return finishUsing(foundTracks);
    setArtists(foundArtists);
    setStep(2);
  }

  async function toStep3() {
    if (artistIds.length === 0) return finishUsing(genreTracks);
    setLoading(true);
    const results = await Promise.all(
      artistIds.map(id => fetch(`/api/artist?id=${id}`).then(r => r.json()).catch(() => ({ artist: null })))
    );
    const seen = new Set<string>();
    const merged: Track[] = [];
    for (const r of results) for (const t of (r.artist?.topSongs ?? [])) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      merged.push(t);
    }
    merged.forEach(cacheTrack);
    setLoading(false);
    if (merged.length === 0) return finishUsing(genreTracks);
    setTracks(merged.slice(0, 30));
    setStep(3);
  }

  const skip = () => step === 1 ? finish([]) : step === 2 ? finishUsing(genreTracks) : finishUsing(tracks);

  return (
    <div style={screenStyle}>
      <button onClick={skip} style={skipBtn}>Lewati</button>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ width: n === step ? 20 : 6, height: 6, borderRadius: 3, background: n === step ? '#1db954' : 'rgba(255,255,255,.25)', transition: 'width .2s' }} />
        ))}
      </div>

      {step === 1 && (
        <>
          <h1 style={titleStyle}>Genre favoritmu apa?</h1>
          <p style={subStyle}>Pilih beberapa, biar beranda kamu lebih pas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 480, marginBottom: 28 }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => setGenres(gs => toggle(gs, g))}
                style={chipStyle(genres.includes(g))}>
                {g}
              </button>
            ))}
          </div>
          <button onClick={toStep2} disabled={loading} style={primaryBtn}>
            {loading ? 'Memuat...' : 'Lanjut'}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={titleStyle}>Suka artis yang mana?</h1>
          <p style={subStyle}>Berdasarkan genre yang kamu pilih</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 560, marginBottom: 28 }}>
            {artists.map(a => (
              <div key={a.id} onClick={() => setArtistIds(ids => toggle(ids, a.id))}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 90, cursor: 'pointer' }}>
                <img src={a.thumbnail} alt={a.name} style={{
                  width: 74, height: 74, borderRadius: '50%', objectFit: 'cover',
                  border: artistIds.includes(a.id) ? '3px solid #1db954' : '3px solid transparent',
                  opacity: artistIds.includes(a.id) ? 1 : .7,
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: '#fff' }}>{a.name}</span>
              </div>
            ))}
          </div>
          <button onClick={toStep3} disabled={loading} style={primaryBtn}>
            {loading ? 'Memuat...' : 'Lanjut'}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h1 style={titleStyle}>Lagu apa yang kamu suka?</h1>
          <p style={subStyle}>Dari artis pilihanmu</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, width: '100%', marginBottom: 28, maxHeight: 340, overflowY: 'auto' }}>
            {tracks.map(t => (
              <div key={t.id} onClick={() => setTrackIds(ids => toggle(ids, t.id))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8, cursor: 'pointer',
                  background: trackIds.includes(t.id) ? 'rgba(29,185,84,.15)' : 'rgba(255,255,255,.05)',
                }}>
                <img src={t.thumbnail} alt={t.title} style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: '#b3b3b3' }}>{t.artist}</div>
                </div>
                {trackIds.includes(t.id) && (
                  <svg width="18" height="18" fill="none" stroke="#1db954" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => trackIds.length ? finish(trackIds) : finishUsing(tracks)} style={primaryBtn}>Selesai</button>
        </>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = { fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900, marginBottom: 8, color: '#fff', textAlign: 'center' };
const subStyle: React.CSSProperties = { color: '#b3b3b3', marginBottom: 28, fontSize: 14, textAlign: 'center' };

const primaryBtn: React.CSSProperties = {
  background: '#1db954', color: '#000', border: 'none', borderRadius: 20, padding: '10px 32px',
  fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};

const skipBtn: React.CSSProperties = {
  position: 'absolute', top: 24, right: 24, background: 'transparent', color: '#b3b3b3',
  border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '6px 16px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
    color: '#fff', background: active ? '#1db954' : 'rgba(255,255,255,.08)',
    border: active ? '2px solid #1db954' : '2px solid transparent',
  };
}
