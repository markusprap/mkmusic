import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ tracks: [] });
  const tracks = await searchYouTubeVideos(q);
  return NextResponse.json({ tracks });
}
