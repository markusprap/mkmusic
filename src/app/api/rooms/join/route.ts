import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchRoomMembers, toRoomResponse } from '@/lib/rooms-server';

// POST /api/rooms/join { code, profileId }
// RLS on `rooms` already scopes the code lookup to the caller's own account —
// a code from a different account simply doesn't match, enforcing
// same-account-only joins without any extra check here.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const code = body?.code?.trim().toUpperCase();
  const profileId = body?.profileId;
  if (!code || !profileId) return NextResponse.json({ error: 'Kode dan profil wajib diisi' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', profileId).single();
  if (!profile) return NextResponse.json({ error: 'Profil tidak valid' }, { status: 403 });

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single();
  if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });

  await supabase.from('room_members').upsert({ room_id: room.id, profile_id: profileId }, { onConflict: 'room_id,profile_id' });

  const members = await fetchRoomMembers(supabase, room.id);
  return NextResponse.json({ room: toRoomResponse(room, members) });
}
