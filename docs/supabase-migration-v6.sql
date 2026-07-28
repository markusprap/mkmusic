-- mkmusic Revision 6: per-track play counts (for "Sering diputar" in Pilihan Cepat)
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.

alter table profiles add column if not exists play_counts jsonb not null default '{}'::jsonb;
