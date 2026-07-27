import { NextRequest, NextResponse } from 'next/server';
import { getYTMusicClient } from '@/lib/youtube';

function toTrack(s: any) {
  return {
    id: s.videoId,
    title: s.name,
    artist: s.artist?.name ?? '',
    artistId: s.artist?.artistId ?? undefined,
    thumbnail: s.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`,
    duration: 0,
  };
}

function toRelease(a: any) {
  return {
    id: a.albumId ?? a.playlistId,
    name: a.name,
    year: a.year ?? null,
    thumbnail: a.thumbnails?.[0]?.url ?? '',
  };
}

// GET /api/artist?id=<artistId> — top songs/albums/singles/featured playlists/similar artists
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID artis wajib diisi' }, { status: 400 });

  try {
    const client = await getYTMusicClient();
    const artist = await client.getArtist(id);

    return NextResponse.json({
      artist: {
        id,
        name: artist.name,
        thumbnail: artist.thumbnails?.[artist.thumbnails.length - 1]?.url ?? artist.thumbnails?.[0]?.url ?? '',
        topSongs: (artist.topSongs ?? []).map(toTrack),
        topAlbums: (artist.topAlbums ?? []).map(toRelease),
        topSingles: (artist.topSingles ?? []).map(toRelease),
        featuredOn: (artist.featuredOn ?? []).map((p: any) => ({ id: p.playlistId, name: p.name, thumbnail: p.thumbnails?.[0]?.url ?? '' })),
        similarArtists: (artist.similarArtists ?? []).map((a: any) => ({ id: a.artistId, name: a.name, thumbnail: a.thumbnails?.[0]?.url ?? '' })),
      },
    });
  } catch (err) {
    console.error('artist fetch error:', err);
    return NextResponse.json({ error: 'Gagal memuat artis' }, { status: 500 });
  }
}
