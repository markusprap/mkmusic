import { NextResponse } from 'next/server';
import { searchYouTubeTracks } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  const tracks = await searchYouTubeTracks(q);
  return NextResponse.json({ tracks });
}
