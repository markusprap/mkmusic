export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnail: string;
  duration: number;
}

export function formatDuration(s: number): string {
  if (!s) return '–';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Public profile fields only — no PIN, safe to show on the "who's listening" screen.
export interface PublicProfile {
  id: string;
  name: string;
  avatar: string;
}

export interface Profile extends PublicProfile {
  likedIds: string[];
  playlists: Playlist[];
  recentIds: string[];
  playCounts: Record<string, number>;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

// Track cache (in-memory, keyed by id)
let trackCache: Record<string, Track> = {};

// Merges into the existing cache entry rather than overwriting it outright —
// some sources (e.g. /api/upnext, per ytmusic-api's own inconsistent
// artist-object shape there) return a thinner Track than one already cached
// from a richer source (Home/search). A blind overwrite let a later, thinner
// write erase fields like artistId that something else already knew.
export function cacheTrack(t: Track) {
  const existing = trackCache[t.id];
  trackCache[t.id] = existing ? {
    id: t.id,
    title: t.title || existing.title,
    artist: t.artist || existing.artist,
    artistId: t.artistId ?? existing.artistId,
    thumbnail: t.thumbnail || existing.thumbnail,
    duration: t.duration || existing.duration,
  } : t;
}
export function getTrack(id: string): Track | undefined { return trackCache[id]; }

// Fetches metadata for track IDs missing from the cache (e.g. a profile's
// recent/liked IDs right after loading, before anything's been played this
// session) and caches the results. Returns nothing — callers re-render to
// pick up the now-populated cache via getTrack().
export async function hydrateTracks(ids: string[]): Promise<void> {
  const missing = [...new Set(ids)].filter(id => !trackCache[id]).slice(0, 50);
  if (missing.length === 0) return;
  try {
    const res = await fetch(`/api/tracks?ids=${missing.join(',')}`);
    const data = await res.json();
    (data.tracks ?? []).forEach(cacheTrack);
  } catch {
    // best-effort — missing tracks just stay absent from these lists
  }
}

// Normalize profile objects
export function normalizeProfile(p: any): Profile {
  return {
    id: p?.id || crypto.randomUUID(),
    name: p?.name || 'User',
    avatar: p?.avatar || '/avatar/cranks.svg',
    likedIds: Array.isArray(p?.likedIds) ? p.likedIds : [],
    playlists: Array.isArray(p?.playlists) ? p.playlists.map((pl: any) => ({
      id: pl?.id || crypto.randomUUID(),
      name: pl?.name || 'Playlist',
      trackIds: Array.isArray(pl?.trackIds) ? pl.trackIds : [],
      createdAt: pl?.createdAt || Date.now(),
    })) : [],
    recentIds: Array.isArray(p?.recentIds) ? p.recentIds : [],
    playCounts: (p?.playCounts && typeof p.playCounts === 'object') ? p.playCounts : {},
  };
}

// PIN never touches the browser — all profile I/O goes through /api/profiles.
async function postJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export async function fetchPublicProfiles(): Promise<PublicProfile[]> {
  try {
    const res = await fetch('/api/profiles');
    const data = await res.json();
    return Array.isArray(data.profiles) ? data.profiles : [];
  } catch {
    return [];
  }
}

export async function createProfileRemote(
  name: string, avatar: string, pin: string
): Promise<{ profile: PublicProfile } | { error: string }> {
  const { ok, data } = await postJson('/api/profiles', 'POST', { name, avatar, pin });
  return ok ? { profile: data.profile } : { error: data.error || 'Gagal membuat profil' };
}

export async function unlockProfile(id: string, pin: string): Promise<{ profile: Profile } | { error: string }> {
  const { ok, data } = await postJson(`/api/profiles/${id}/unlock`, 'POST', { pin });
  return ok ? { profile: normalizeProfile(data.profile) } : { error: data.error || 'PIN salah' };
}

export async function deleteProfileRemote(id: string, pin: string): Promise<boolean> {
  const { ok } = await postJson(`/api/profiles/${id}`, 'DELETE', { pin });
  return ok;
}

// Trusted post-unlock: syncs liked/playlists/recent + profile fields, no PIN needed.
export async function syncProfile(profile: Profile): Promise<boolean> {
  try {
    const { ok } = await postJson(`/api/profiles/${profile.id}`, 'PUT', {
      name: profile.name,
      avatar: profile.avatar,
      likedIds: profile.likedIds,
      playlists: profile.playlists,
      recentIds: profile.recentIds,
      playCounts: profile.playCounts,
    });
    return ok;
  } catch {
    return false;
  }
}

const ACTIVE_KEY = 'mkmusic_last_profile';

// Convenience only (pre-highlight last used profile) — never used to skip the PIN screen.
export function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function toggleLike(profile: Profile, trackId: string): Profile {
  const p = normalizeProfile(profile);
  const likedIds = p.likedIds.includes(trackId)
    ? p.likedIds.filter(id => id !== trackId)
    : [...p.likedIds, trackId];
  return { ...p, likedIds };
}

// Single choke point every track play routes through (called once, from
// playTrack in page.tsx) — also bumps playCounts here rather than adding a
// second parallel "record a play" function.
export function addRecent(profile: Profile, trackId: string): Profile {
  const p = normalizeProfile(profile);
  const recentIds = [trackId, ...p.recentIds.filter(id => id !== trackId)].slice(0, 50);
  const playCounts = { ...p.playCounts, [trackId]: (p.playCounts[trackId] || 0) + 1 };
  return { ...p, recentIds, playCounts };
}

export function createPlaylist(profile: Profile, name: string): { profile: Profile; playlist: Playlist } {
  const p = normalizeProfile(profile);
  const playlist: Playlist = { id: crypto.randomUUID(), name, trackIds: [], createdAt: Date.now() };
  return { profile: { ...p, playlists: [...p.playlists, playlist] }, playlist };
}

export function addToPlaylist(profile: Profile, playlistId: string, trackId: string): Profile {
  const p = normalizeProfile(profile);
  return {
    ...p,
    playlists: p.playlists.map(pl =>
      pl.id === playlistId && !pl.trackIds.includes(trackId)
        ? { ...pl, trackIds: [...pl.trackIds, trackId] }
        : pl
    ),
  };
}

export function removeFromPlaylist(profile: Profile, playlistId: string, trackId: string): Profile {
  const p = normalizeProfile(profile);
  return {
    ...p,
    playlists: p.playlists.map(pl =>
      pl.id === playlistId ? { ...pl, trackIds: pl.trackIds.filter(id => id !== trackId) } : pl
    ),
  };
}
