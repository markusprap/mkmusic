import { NextRequest, NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';

let ytmusic: YTMusic | null = null;
async function getClient(): Promise<YTMusic> {
  if (!ytmusic) { ytmusic = new YTMusic(); await ytmusic.initialize(); }
  return ytmusic;
}

// GET /api/upnext?videoId=xxx
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ tracks: [] });

  try {
    const client = await getClient();
    const items = await client.getUpNexts(videoId);
    const tracks = items.slice(0, 20).map((item: any) => ({
      id: item.videoId,
      title: item.title ?? 'Unknown',
      artist: item.artists ?? item.artist?.name ?? 'YouTube Music',
      thumbnail: item.thumbnail ?? item.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      duration: 0,
    }));
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error('upnext error:', err);
    return NextResponse.json({ tracks: [] });
  }
}
