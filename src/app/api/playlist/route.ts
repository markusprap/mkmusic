import { NextRequest, NextResponse } from 'next/server';
import { getYTMusicClient } from '@/lib/youtube';

// GET /api/playlist?id=<playlistId> — song count, first 4 thumbnails (2x2
// collage), and the first 3 tracks (community-playlist preview list), all
// from one getPlaylistVideos() call. getPlaylist() explicitly excludes
// tracks ("all possible information except the tracks" per ytmusic-api's
// own docs) — getPlaylistVideos() is the one that actually returns them, so
// videos.length doubles as the real song count with no second call needed.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID playlist wajib diisi' }, { status: 400 });

  try {
    const client = await getYTMusicClient();
    const videos = await client.getPlaylistVideos(id);

    return NextResponse.json({
      count: videos.length,
      thumbnails: videos.slice(0, 4).map((v: any) => v.thumbnails?.[0]?.url ?? ''),
      tracks: videos.slice(0, 3).map((v: any) => ({
        id: v.videoId, title: v.name, artist: v.artist?.name ?? '',
        thumbnail: v.thumbnails?.[0]?.url ?? '', duration: 0,
      })),
    });
  } catch (err) {
    console.error('playlist fetch error:', err);
    return NextResponse.json({ error: 'Gagal memuat playlist' }, { status: 500 });
  }
}
