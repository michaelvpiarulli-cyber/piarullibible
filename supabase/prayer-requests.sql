-- Lifegroup prayer requests — share within circles:
--   guys  = men in the same family/lifegroup
--   girls = women in the same family/lifegroup
--   group = everyone in the same family/lifegroup
--   wife  = only people who share your couple code (spouse pair)
--
-- Depends on public.groups / public.group_members / public.is_group_member
-- from supabase/groups.sql. Run that first, then this file once in the
-- Supabase SQL Editor.

create table if not exists public.prayer_profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  display_name     text not null,
  -- 'guy' | 'girl' — used to gate guys/girls circles
  gender           text not null check (gender in ('guy', 'girl')),
  -- Shared secret both spouses enter (normalized uppercase). Null = no wife circle.
  spouse_pair_code text,
  updated_at       timestamptz not null default now()
);

create table if not exists public.prayer_requests (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references auth.users (id) on delete cascade,
  -- Required for guys / girls / group. Optional for wife (couple-only).
  group_id         uuid references public.groups (id) on delete cascade,
  circle           text not null check (circle in ('guys', 'girls', 'group', 'wife')),
  body             text not null,
  author_name      text not null,
  -- Copied from the author's profile at insert time for wife-circle RLS.
  spouse_pair_code text,
  answered_at      timestamptz,
  created_at       timestamptz not null default now(),
  constraint prayer_requests_group_for_shared
    check (
      (circle = 'wife' and spouse_pair_code is not null)
      or (circle in ('guys', 'girls', 'group') and group_id is not null)
    )
);

create index if not exists prayer_requests_group_idx
  on public.prayer_requests (group_id, created_at desc);
create index if not exists prayer_requests_spouse_idx
  on public.prayer_requests (spouse_pair_code, created_at desc)
  where circle = 'wife';

-- Helpers (SECURITY DEFINER) so RLS can read your own profile without recursion.
create or replace function public.my_prayer_gender()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select gender from public.prayer_profiles where user_id = auth.uid();
$$;

create or replace function public.my_spouse_pair_code()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select spouse_pair_code from public.prayer_profiles where user_id = auth.uid();
$$;

alter table public.prayer_profiles enable row level security;
alter table public.prayer_requests enable row level security;

drop policy if exists "prayer_profiles select" on public.prayer_profiles;
drop policy if exists "prayer_profiles upsert" on public.prayer_profiles;
drop policy if exists "prayer_profiles update" on public.prayer_profiles;
create policy "prayer_profiles select" on public.prayer_profiles for select
  using (user_id = auth.uid());
create policy "prayer_profiles upsert" on public.prayer_profiles for insert
  with check (user_id = auth.uid());
create policy "prayer_profiles update" on public.prayer_profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "prayer_requests select" on public.prayer_requests;
drop policy if exists "prayer_requests insert" on public.prayer_requests;
drop policy if exists "prayer_requests update" on public.prayer_requests;
drop policy if exists "prayer_requests delete" on public.prayer_requests;

-- See requests in circles you’re allowed into (plus anything you authored).
create policy "prayer_requests select" on public.prayer_requests for select
  using (
    author_id = auth.uid()
    or (
      circle = 'group'
      and group_id is not null
      and public.is_group_member(group_id)
    )
    or (
      circle = 'guys'
      and group_id is not null
      and public.is_group_member(group_id)
      and public.my_prayer_gender() = 'guy'
    )
    or (
      circle = 'girls'
      and group_id is not null
      and public.is_group_member(group_id)
      and public.my_prayer_gender() = 'girl'
    )
    or (
      circle = 'wife'
      and spouse_pair_code is not null
      and spouse_pair_code = public.my_spouse_pair_code()
    )
  );

create policy "prayer_requests insert" on public.prayer_requests for insert
  with check (
    author_id = auth.uid()
    and (
      (
        circle in ('guys', 'girls', 'group')
        and group_id is not null
        and public.is_group_member(group_id)
      )
      or (
        circle = 'wife'
        and spouse_pair_code is not null
        and spouse_pair_code = public.my_spouse_pair_code()
      )
    )
  );

create policy "prayer_requests update" on public.prayer_requests for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "prayer_requests delete" on public.prayer_requests for delete
  using (author_id = auth.uid());
