-- mkmusic: in-app feedback (star rating + optional comment)
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

-- Insert-only from the app. No select policy — read submissions from the
-- Table Editor (postgres role bypasses RLS), no in-app admin view needed.
create policy "insert own feedback" on feedback
  for insert with check (account_id = auth.uid());
