import { NextRequest, NextResponse } from 'next/server';
import { getYTMusicClient } from '@/lib/youtube';

// GET /api/tracks?ids=id1,id2,... — batch-fetch title/artist/thumbnail for
// track IDs whose metadata isn't in the client's (in-memory, non-persisted)
// cache, e.g. right after loading a profile with existing recent/liked IDs.
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ tracks: [] });

  const client = await getYTMusicClient();
  const results = await Promise.allSettled(ids.map(async id => {
    try {
      const song = await client.getSong(id);
      return { id, title: song.name, artist: song.artist?.name ?? '', artistId: song.artist?.artistId ?? undefined, thumbnail: song.thumbnails?.[0]?.url ?? '', duration: song.duration ?? 0 };
    } catch {
      const video = await client.getVideo(id);
      return { id, title: video.name, artist: video.artist?.name ?? '', artistId: video.artist?.artistId ?? undefined, thumbnail: video.thumbnails?.[0]?.url ?? '', duration: video.duration ?? 0 };
    }
  }));

  const tracks = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map(r => r.value);
  return NextResponse.json({ tracks });
}
