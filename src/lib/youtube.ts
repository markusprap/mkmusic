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

    return songs.slice(0, 20).map((s) => ({
      id: s.videoId,
      title: s.name,
      artist: s.artist?.name ?? 'YouTube Music',
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
