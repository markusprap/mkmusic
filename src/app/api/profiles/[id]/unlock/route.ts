import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/pin';

// POST /api/profiles/[id]/unlock { pin } — full profile only on correct PIN, pin_hash never returned.
// RLS scopes the lookup to the signed-in account, so this can't be used to probe other accounts' profiles.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

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
