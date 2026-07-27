import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/rooms/[id]/leave { profileId } — removes the member; deletes the
// room once nobody's left in it (equal-control model, no host to hand off to).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const profileId = body?.profileId;
  if (!profileId) return NextResponse.json({ error: 'Profil wajib diisi' }, { status: 400 });

  await supabase.from('room_members').delete().eq('room_id', params.id).eq('profile_id', profileId);

  const { count } = await supabase.from('room_members').select('profile_id', { count: 'exact', head: true }).eq('room_id', params.id);
  if ((count ?? 0) === 0) {
    await supabase.from('rooms').delete().eq('id', params.id);
  }

  return NextResponse.json({ ok: true });
}
