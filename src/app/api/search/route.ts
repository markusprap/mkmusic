import { NextResponse } from 'next/server';
import { searchYouTubeTracks, searchYouTubeArtists, searchYouTubeAlbums, searchYouTubePlaylists } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) {
    return NextResponse.json({ tracks: [], artists: [], albums: [], playlists: [] });
  }

  // Categorized like Spotify/YT Music search (songs/artists/albums/playlists
  // as separate result sets, not one list with fake categories derived from it).
  const [tracks, artists, albums, playlists] = await Promise.all([
    searchYouTubeTracks(q),
    searchYouTubeArtists(q),
    searchYouTubeAlbums(q),
    searchYouTubePlaylists(q),
  ]);
  return NextResponse.json({ tracks, artists, albums, playlists });
}
