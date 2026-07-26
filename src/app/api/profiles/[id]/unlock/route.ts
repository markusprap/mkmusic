import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPin } from '@/lib/pin';

// POST /api/profiles/[id]/unlock { pin } — full profile only on correct PIN, pin_hash never returned.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 });

  if (!verifyPin(body?.pin ?? '', data.pin_hash)) {
    return NextResponse.json({ error: 'PIN salah' }, { status: 401 });
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      name: data.name,
      color: data.color,
      avatar: data.avatar,
      likedIds: data.liked_ids ?? [],
      playlists: data.playlists ?? [],
      recentIds: data.recent_ids ?? [],
    },
  });
}
