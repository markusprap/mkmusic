import { NextRequest, NextResponse } from 'next/server';
import { getYTMusicClient } from '@/lib/youtube';

// GET /api/album?id=<albumId> — album header + full track list
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID album wajib diisi' }, { status: 400 });

  try {
    const client = await getYTMusicClient();
    const album = await client.getAlbum(id);

    return NextResponse.json({
      album: {
        id,
        name: album.name,
        artist: album.artist?.name ?? '',
        artistId: album.artist?.artistId ?? undefined,
        year: album.year ?? null,
        thumbnail: album.thumbnails?.[album.thumbnails.length - 1]?.url ?? album.thumbnails?.[0]?.url ?? '',
        tracks: (album.songs ?? []).map((s: any) => ({
          id: s.videoId,
          title: s.name,
          artist: s.artist?.name ?? album.artist?.name ?? '',
          artistId: s.artist?.artistId ?? album.artist?.artistId ?? undefined,
          thumbnail: s.thumbnails?.[0]?.url ?? album.thumbnails?.[0]?.url ?? '',
          duration: 0,
        })),
      },
    });
  } catch (err) {
    console.error('album fetch error:', err);
    return NextResponse.json({ error: 'Gagal memuat album' }, { status: 500 });
  }
}
