-- Family groups — share READING PROGRESS ONLY with people you invite.
-- Notes and highlights are never shared; only the summary columns below are.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  display_name   text not null,
  -- shared progress summary only (no notes, no highlights)
  current_day    int not null default 1,
  streak         int not null default 0,
  completed_days int not null default 0,
  updated_at     timestamptz not null default now(),
  unique (group_id, user_id)
);

-- SECURITY DEFINER helper avoids recursive RLS when a policy on group_members
-- needs to ask "is the caller a member of this group?".
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- groups: any signed-in user may look one up (to join by code) or create one.
drop policy if exists "groups select" on public.groups;
drop policy if exists "groups insert" on public.groups;
create policy "groups select" on public.groups for select
  using (auth.role() = 'authenticated');
create policy "groups insert" on public.groups for insert
  with check (auth.uid() = created_by);

-- group_members: read everyone in groups you belong to; manage only your row.
drop policy if exists "gm select" on public.group_members;
drop policy if exists "gm insert" on public.group_members;
drop policy if exists "gm update" on public.group_members;
drop policy if exists "gm delete" on public.group_members;
create policy "gm select" on public.group_members for select
  using (public.is_group_member(group_id));
create policy "gm insert" on public.group_members for insert
  with check (user_id = auth.uid());
create policy "gm update" on public.group_members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "gm delete" on public.group_members for delete
  using (user_id = auth.uid());
