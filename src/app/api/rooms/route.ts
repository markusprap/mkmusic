import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toRoomResponse } from '@/lib/rooms-server';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

// POST /api/rooms { profileId, queue, currentIndex, isPlaying, positionSeconds }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const profileId = body?.profileId;
  if (!profileId) return NextResponse.json({ error: 'Profil wajib diisi' }, { status: 400 });

  // RLS on `profiles` already scopes this select to the caller's own account.
  const { data: profile } = await supabase.from('profiles').select('id, name, avatar').eq('id', profileId).single();
  if (!profile) return NextResponse.json({ error: 'Profil tidak valid' }, { status: 403 });

  let room = null;
  for (let attempt = 0; attempt < 5 && !room; attempt++) {
    const { data, error } = await supabase.from('rooms').insert({
      account_id: user.id,
      host_profile_id: profileId,
      code: generateCode(),
      queue: body.queue ?? [],
      current_index: body.currentIndex ?? 0,
      is_playing: !!body.isPlaying,
      position_seconds: body.positionSeconds ?? 0,
      position_updated_at: new Date().toISOString(),
    }).select().single();
    if (data) room = data;
    else if (error?.code !== '23505') { // unique_violation on code -> retry, anything else -> bail
      console.error('room create error:', error);
      return NextResponse.json({ error: 'Gagal membuat room' }, { status: 500 });
    }
  }
  if (!room) return NextResponse.json({ error: 'Gagal membuat room' }, { status: 500 });

  await supabase.from('room_members').insert({ room_id: room.id, profile_id: profileId });

  return NextResponse.json({ room: toRoomResponse(room, [profile]) });
}
