-- mkmusic Revision 3: Google/email accounts + RLS
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Also enable in Dashboard -> Authentication -> Providers:
--   - Google (needs a Google Cloud OAuth Client ID/Secret)
--   - Email (usually already on by default for new projects)
--
-- Heads up: profiles created before this migration have no account_id and
-- will become invisible once RLS is enabled below (RLS can't retroactively
-- assign them to an account that doesn't exist yet). Recreate any profile
-- you need after your first login.

alter table profiles add column if not exists account_id uuid references auth.users(id) on delete cascade;

alter table profiles enable row level security;

-- Revision 2 left a permissive "Public Access" policy (cmd ALL, true) — RLS
-- policies are OR'd, so it must be dropped or it overrides every policy below.
drop policy if exists "Public Access" on profiles;

create policy "select own profiles" on profiles
  for select using (account_id = auth.uid());

create policy "insert own profiles" on profiles
  for insert with check (account_id = auth.uid());

create policy "update own profiles" on profiles
  for update using (account_id = auth.uid());

create policy "delete own profiles" on profiles
  for delete using (account_id = auth.uid());
