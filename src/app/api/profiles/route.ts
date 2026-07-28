import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPin } from '@/lib/pin';

const MAX_PROFILES = 5;

// GET /api/profiles — public fields only, never pin_hash. RLS scopes this to the signed-in account.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .order('updated_at', { ascending: true });
  if (error) { console.error('profiles list error:', error); return NextResponse.json({ profiles: [] }); }
  return NextResponse.json({ profiles: data ?? [] });
}

// POST /api/profiles { name, color, avatar, pin }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const pin = body?.pin;
  const color = '#1db954'; // ponytail: `color` column kept NOT NULL-safe server-side; no longer exposed to clients, avatar images carry their own look
  const avatar = body?.avatar || '/avatar/cranks.svg';

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  if (!/^\d{4}$/.test(pin ?? '')) return NextResponse.json({ error: 'PIN harus 4 digit angka' }, { status: 400 });

  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
  if ((count ?? 0) >= MAX_PROFILES) {
    return NextResponse.json({ error: `Maksimal ${MAX_PROFILES} profil` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from('profiles').insert({
    id, name, color, avatar,
    account_id: user.id,
    pin_hash: hashPin(pin),
    liked_ids: [], playlists: [], recent_ids: [],
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error('profiles create error:', error); return NextResponse.json({ error: 'Gagal membuat profil' }, { status: 500 }); }

  return NextResponse.json({ profile: { id, name, avatar } });
}
