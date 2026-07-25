-- Sync the prayer journal, memory verses, and sermon notes to the account.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: every column is added only if missing.
--
--   journal  [{ id, kind, text, day, createdAt, answeredAt }, ...]
--   memory   { verses: [...], reviewedOn, dailyCount }
--   sermons  [{ id, title, speaker, date, passage, notes, takeaway, createdAt }, ...]
--
-- Existing rows default to empty, so nobody loses what they already have.

alter table public.user_data
  add column if not exists journal jsonb not null default '[]'::jsonb,
  add column if not exists memory  jsonb not null default '{}'::jsonb,
  add column if not exists sermons jsonb not null default '[]'::jsonb;
