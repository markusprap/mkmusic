import { NextRequest, NextResponse } from 'next/server';
import { getAudioUrl } from '@/lib/potoken';

// GET /api/audio?videoId=xxx — direct playable audio stream URL
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ error: 'videoId wajib diisi' }, { status: 400 });

  try {
    const url = await getAudioUrl(videoId);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('audio stream error:', err);
    return NextResponse.json({ error: 'Gagal memuat audio' }, { status: 500 });
  }
}
