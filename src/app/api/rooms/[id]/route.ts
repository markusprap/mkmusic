import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchRoomMembers, toRoomResponse } from '@/lib/rooms-server';

// GET /api/rooms/[id] — current room state + members. Used to hydrate a
// client that joined late or refreshed mid-session.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const { data: room, error } = await supabase.from('rooms').select('*').eq('id', params.id).single();
  if (error || !room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });

  const members = await fetchRoomMembers(supabase, room.id);
  return NextResponse.json({ room: toRoomResponse(room, members) });
}

// PUT /api/rooms/[id] { queue, currentIndex, isPlaying, positionSeconds } —
// any member may update (equal-control model, no host-only authority).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const { error } = await supabase.from('rooms').update({
    queue: body.queue,
    current_index: body.currentIndex,
    is_playing: body.isPlaying,
    position_seconds: body.positionSeconds,
    position_updated_at: new Date().toISOString(),
  }).eq('id', params.id);

  if (error) { console.error('room update error:', error); return NextResponse.json({ error: 'Gagal update room' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
