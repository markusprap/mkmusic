import YTMusic from 'ytmusic-api';
import { Track } from './store';

// ponytail: singleton instance, initialize once per server process
let ytmusic: YTMusic | null = null;

export async function getYTMusicClient(): Promise<YTMusic> {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    await ytmusic.initialize();
  }
  return ytmusic;
}

export async function searchYouTubeTracks(query: string): Promise<Track[]> {
  try {
    const client = await getYTMusicClient();
    const songs = await client.searchSongs(query);

    return songs.slice(0, 40).map((s) => ({
      id: s.videoId,
      title: s.name,
      artist: s.artist?.name ?? 'YouTube Music',
      artistId: s.artist?.artistId ?? undefined,
      thumbnail:
        s.thumbnails?.[0]?.url ??
        `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`,
      duration: (s as any).duration?.totalSeconds ?? 0,
    }));
  } catch (err) {
    console.error('ytmusic-api search error:', err);
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
