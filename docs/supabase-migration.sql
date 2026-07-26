-- mkmusic Revision 2: Netflix-style PIN profiles
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- (Claude Code has no DDL/service-role access to this project, so this step is manual.)

alter table profiles add column if not exists pin_hash text;
alter table profiles add column if not exists avatar text;

-- Clean slate: wipe all existing profiles per user request (no migration of old data).
delete from profiles;
