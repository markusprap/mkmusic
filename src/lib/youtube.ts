import YTMusic from 'ytmusic-api';
import { Track } from './store';

// ponytail: singleton client, initialized once per server process.
// Caches the in-flight init *promise* (not just the instance) — routes like
// Home's fetchHome fire several of these concurrently, and `new YTMusic()`
// makes the instance truthy before `initialize()` actually populates its
// internal config, so a bare `if (!ytmusic)` check lets concurrent callers
// race past initialization and hit the API with an empty config (requests
// like `youtubei/undefined/search?key=undefined`, silently swallowed by the
// try/catch in every function below into empty results). Awaiting the same
// promise everywhere closes that window.
let ytmusicPromise: Promise<YTMusic> | null = null;

export function getYTMusicClient(): Promise<YTMusic> {
  if (!ytmusicPromise) {
    const client = new YTMusic();
    // Without a locale, YouTube Music serves its generic US/English guest
    // feed ("Pop", "Today's International hits") — GL/HL steer the same
    // anonymous session to Indonesia's home feed instead (Dangdut, local
    // charts, Bahasa titles), much closer to what the real app shows.
    ytmusicPromise = client.initialize({ GL: 'ID', HL: 'id' }).then(() => client);
  }
  return ytmusicPromise;
}

function toTrack(s: any): Track {
  return {
    id: s.videoId,
    title: s.name,
    artist: s.artist?.name ?? 'YouTube Music',
    artistId: s.artist?.artistId ?? undefined,
    thumbnail: s.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`,
    duration: s.duration?.totalSeconds ?? 0,
  };
}

// ytmusic-api's searchSongs() makes a single request with no pagination —
// it always returns one page (~20 results), how many YouTube ever returns
// for one search call. searchVideos() is a second, differently-filtered
// search on the same query, so merging + deduping the two roughly doubles
// the real pool instead of just changing a slice() that was never the
// actual bottleneck.
export async function searchYouTubeTracks(query: string): Promise<Track[]> {
  try {
    const client = await getYTMusicClient();
    const [songs, videos] = await Promise.all([
      client.searchSongs(query),
      client.searchVideos(query).catch(() => []),
    ]);

    const seen = new Set<string>();
    const merged: Track[] = [];
    for (const s of [...songs, ...videos]) {
      if (seen.has(s.videoId)) continue;
      seen.add(s.videoId);
      merged.push(toTrack(s));
    }
    return merged.slice(0, 40);
  } catch (err) {
    console.error('ytmusic-api search error:', err);
    return [];
  }
}

// searchVideos() alone (not merged with searchSongs() like
// searchYouTubeTracks()) — for rows that specifically want video-flavored,
// often-widescreen thumbnails (e.g. "Video musik untuk Anda").
export async function searchYouTubeVideos(query: string): Promise<Track[]> {
  try {
    const client = await getYTMusicClient();
    const videos = await client.searchVideos(query);
    return videos.slice(0, 20).map(toTrack);
  } catch (err) {
    console.error('ytmusic-api searchVideos error:', err);
    return [];
  }
}

export interface ArtistResult { id: string; name: string; thumbnail: string }
export interface AlbumResult { id: string; name: string; artist: string; artistId?: string; year: number | null; thumbnail: string }
export interface PlaylistResult { id: string; name: string; artist: string; thumbnail: string }

export async function searchYouTubeArtists(query: string): Promise<ArtistResult[]> {
  try {
    const client = await getYTMusicClient();
    const artists = await client.searchArtists(query);
    return artists.slice(0, 20).map((a) => ({
      id: a.artistId,
      name: a.name,
      thumbnail: a.thumbnails?.[0]?.url ?? '',
    }));
  } catch (err) {
    console.error('ytmusic-api searchArtists error:', err);
    return [];
  }
}

export async function searchYouTubeAlbums(query: string): Promise<AlbumResult[]> {
  try {
    const client = await getYTMusicClient();
    const albums = await client.searchAlbums(query);
    return albums.slice(0, 20).map((a) => ({
      id: a.albumId,
      name: a.name,
      artist: a.artist?.name ?? '',
      artistId: a.artist?.artistId ?? undefined,
      year: a.year ?? null,
      thumbnail: a.thumbnails?.[0]?.url ?? '',
    }));
  } catch (err) {
    console.error('ytmusic-api searchAlbums error:', err);
    return [];
  }
}

export async function searchYouTubePlaylists(query: string): Promise<PlaylistResult[]> {
  try {
    const client = await getYTMusicClient();
    const playlists = await client.searchPlaylists(query);
    return playlists.slice(0, 20).map((p) => ({
      id: p.playlistId,
      name: p.name,
      artist: p.artist?.name ?? '',
      thumbnail: p.thumbnails?.[0]?.url ?? '',
    }));
  } catch (err) {
    console.error('ytmusic-api searchPlaylists error:', err);
    return [];
  }
}
