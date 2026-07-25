-- Sync the prayer journal and memory verses to the user's account.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
--   journal  [{ id, kind, text, day, createdAt, answeredAt }, ...]
--   memory   { verses: [...], reviewedOn, dailyCount }
--
-- Existing rows default to empty, so nobody loses what they already have.

alter table public.user_data
  add column if not exists journal jsonb not null default '[]'::jsonb,
  add column if not exists memory  jsonb not null default '{}'::jsonb;
