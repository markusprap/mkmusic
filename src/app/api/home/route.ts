import { NextRequest, NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';

let ytmusic: YTMusic | null = null;
async function getClient(): Promise<YTMusic> {
  if (!ytmusic) { ytmusic = new YTMusic(); await ytmusic.initialize(); }
  return ytmusic;
}

// GET /api/home — return ytmusic home sections
export async function GET() {
  try {
    const client = await getClient();
    const sections = await client.getHomeSections();

    const result = sections.map((section: any) => ({
      title: section.title ?? 'Rekomendasi',
      items: (section.contents ?? []).slice(0, 10).map((item: any) => ({
        type: item.type,
        id: item.videoId ?? item.playlistId ?? item.albumId ?? item.artistId ?? '',
        videoId: item.videoId ?? null,
        playlistId: item.playlistId ?? null,
        name: item.name ?? item.title ?? 'Unknown',
        artist: item.artist?.name ?? item.artists ?? '',
        thumbnail: item.thumbnails?.[0]?.url ?? item.thumbnail ?? '',
      })).filter((item: any) => item.id && item.thumbnail),
    })).filter((s: any) => s.items.length > 0);

    return NextResponse.json({ sections: result });
  } catch (err) {
    console.error('home error:', err);
    return NextResponse.json({ sections: [] });
  }
}
