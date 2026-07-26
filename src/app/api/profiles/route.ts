import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPin } from '@/lib/pin';

const MAX_PROFILES = 5;

// GET /api/profiles — public fields only, never pin_hash
export async function GET() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, color, avatar')
    .order('updated_at', { ascending: true });
  if (error) { console.error('profiles list error:', error); return NextResponse.json({ profiles: [] }); }
  return NextResponse.json({ profiles: data ?? [] });
}

// POST /api/profiles { name, color, avatar, pin }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const pin = body?.pin;
  const color = body?.color || '#1db954';
  const avatar = body?.avatar || '🎵';

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  if (!/^\d{4}$/.test(pin ?? '')) return NextResponse.json({ error: 'PIN harus 4 digit angka' }, { status: 400 });

  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
  if ((count ?? 0) >= MAX_PROFILES) {
    return NextResponse.json({ error: `Maksimal ${MAX_PROFILES} profil` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from('profiles').insert({
    id, name, color, avatar,
    pin_hash: hashPin(pin),
    liked_ids: [], playlists: [], recent_ids: [],
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error('profiles create error:', error); return NextResponse.json({ error: 'Gagal membuat profil' }, { status: 500 }); }

  return NextResponse.json({ profile: { id, name, color, avatar } });
}
