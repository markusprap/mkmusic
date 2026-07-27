export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

// Public profile fields only — no PIN, safe to show on the "who's listening" screen.
export interface PublicProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface Profile extends PublicProfile {
  likedIds: string[];
  playlists: Playlist[];
  recentIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

// Track cache (in-memory, keyed by id)
let trackCache: Record<string, Track> = {};

export function cacheTrack(t: Track) { trackCache[t.id] = t; }
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
    color: p?.color || '#1db954',
    avatar: p?.avatar || '🎵',
    likedIds: Array.isArray(p?.likedIds) ? p.likedIds : [],
    playlists: Array.isArray(p?.playlists) ? p.playlists.map((pl: any) => ({
      id: pl?.id || crypto.randomUUID(),
      name: pl?.name || 'Playlist',
      trackIds: Array.isArray(pl?.trackIds) ? pl.trackIds : [],
      createdAt: pl?.createdAt || Date.now(),
    })) : [],
    recentIds: Array.isArray(p?.recentIds) ? p.recentIds : [],
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
  name: string, color: string, avatar: string, pin: string
): Promise<{ profile: PublicProfile } | { error: string }> {
  const { ok, data } = await postJson('/api/profiles', 'POST', { name, color, avatar, pin });
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
      color: profile.color,
      avatar: profile.avatar,
      likedIds: profile.likedIds,
      playlists: profile.playlists,
      recentIds: profile.recentIds,
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

export function addRecent(profile: Profile, trackId: string): Profile {
  const p = normalizeProfile(profile);
  const recentIds = [trackId, ...p.recentIds.filter(id => id !== trackId)].slice(0, 50);
  return { ...p, recentIds };
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
