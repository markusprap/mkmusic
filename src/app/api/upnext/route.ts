import { NextRequest, NextResponse } from 'next/server';
import { getYTMusicClient } from '@/lib/youtube';

// GET /api/upnext?videoId=xxx
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ tracks: [] });

  try {
    const client = await getYTMusicClient();
    const items = await client.getUpNexts(videoId);
    const tracks = items.slice(0, 20).map((item: any) => {
      // `artists` is typed as a single {artistId,name} object, but has been
      // observed as a plain string too depending on ytmusic-api's runtime
      // parsing — handle both instead of trusting one shape.
      const artistObj = item.artists && typeof item.artists === 'object' ? item.artists : item.artist;
      return {
        id: item.videoId,
        title: item.title ?? 'Unknown',
        artist: artistObj?.name ?? (typeof item.artists === 'string' ? item.artists : 'YouTube Music'),
        artistId: artistObj?.artistId ?? undefined,
        thumbnail: item.thumbnail ?? item.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: 0,
      };
    });
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error('upnext error:', err);
    return NextResponse.json({ tracks: [] });
  }
}
