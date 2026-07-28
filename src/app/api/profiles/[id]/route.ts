import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPin, verifyPin } from '@/lib/pin';

// PUT /api/profiles/[id] — sync profile data (liked/playlists/recent/playCounts/name/avatar).
// Trusted post-unlock: no PIN needed for data sync. Pass { currentPin, newPin } to change the PIN.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  if (body.newPin) {
    if (!/^\d{4}$/.test(body.newPin)) return NextResponse.json({ error: 'PIN harus 4 digit angka' }, { status: 400 });
    const { data } = await supabase.from('profiles').select('pin_hash').eq('id', params.id).single();
    if (!verifyPin(body.currentPin ?? '', data?.pin_hash)) {
      return NextResponse.json({ error: 'PIN saat ini salah' }, { status: 401 });
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) update.name = body.name;
  if (body.avatar !== undefined) update.avatar = body.avatar;
  if (body.likedIds !== undefined) update.liked_ids = body.likedIds;
  if (body.playlists !== undefined) update.playlists = body.playlists;
  if (body.recentIds !== undefined) update.recent_ids = body.recentIds;
  if (body.playCounts !== undefined) update.play_counts = body.playCounts;
  if (body.newPin) update.pin_hash = hashPin(body.newPin);

  const { error } = await supabase.from('profiles').update(update).eq('id', params.id);
  if (error) { console.error('profiles update error:', error); return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}

// DELETE /api/profiles/[id] { pin } — requires the profile's own PIN to delete.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { data } = await supabase.from('profiles').select('pin_hash').eq('id', params.id).single();
  if (!verifyPin(body?.pin ?? '', data?.pin_hash)) {
    return NextResponse.json({ error: 'PIN salah' }, { status: 401 });
  }
  const { error } = await supabase.from('profiles').delete().eq('id', params.id);
  if (error) { console.error('profiles delete error:', error); return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
