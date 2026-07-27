import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/feedback { rating, comment? } — star rating + optional review text.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum masuk akun' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating tidak valid' }, { status: 400 });
  }

  const { error } = await supabase.from('feedback').insert({
    account_id: user.id,
    rating,
    comment: body?.comment?.trim() || null,
  });
  if (error) { console.error('feedback insert error:', error); return NextResponse.json({ error: 'Gagal mengirim' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
