-- mkmusic Revision 3 part 2: collaborative Rooms
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Sync strategy: Postgres Changes (Realtime) on the `rooms` row, not a
-- separate Broadcast/Realtime-Authorization channel. Supabase's realtime
-- replication already honors RLS, so "only same-account members can hear
-- room updates" falls straight out of the `rooms` SELECT policy below —
-- no extra private-channel setup needed.

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  host_profile_id text not null references profiles(id) on delete cascade,
  code text not null unique,
  queue jsonb not null default '[]',
  current_index int not null default 0,
  is_playing boolean not null default false,
  position_seconds numeric not null default 0,
  position_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  profile_id text not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, profile_id)
);

alter table rooms enable row level security;
alter table room_members enable row level security;

create policy "select own account rooms" on rooms
  for select using (account_id = auth.uid());
create policy "insert own account rooms" on rooms
  for insert with check (account_id = auth.uid());
create policy "update own account rooms" on rooms
  for update using (account_id = auth.uid());
create policy "delete own account rooms" on rooms
  for delete using (account_id = auth.uid());

create policy "select own account room members" on room_members
  for select using (exists (
    select 1 from rooms where rooms.id = room_members.room_id and rooms.account_id = auth.uid()
  ));
create policy "insert own account room members" on room_members
  for insert with check (exists (
    select 1 from rooms where rooms.id = room_members.room_id and rooms.account_id = auth.uid()
  ));
create policy "delete own account room members" on room_members
  for delete using (exists (
    select 1 from rooms where rooms.id = room_members.room_id and rooms.account_id = auth.uid()
  ));

-- Required for the client to receive live UPDATE/DELETE events on `rooms`.
alter publication supabase_realtime add table rooms;
