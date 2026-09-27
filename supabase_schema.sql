-- Harini's Little Space
-- Run this once in Supabase SQL Editor.

create table if not exists public.period_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_start_time time,
  period_end date,
  created_at timestamptz not null default now(),
  constraint period_end_after_start check (period_end is null or period_end >= period_start)
);

create index if not exists period_cycles_user_start_idx
  on public.period_cycles(user_id, period_start desc, period_start_time desc);

alter table public.period_cycles enable row level security;

drop policy if exists "Users can view their own cycles" on public.period_cycles;
create policy "Users can view their own cycles"
on public.period_cycles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can add their own cycles" on public.period_cycles;
create policy "Users can add their own cycles"
on public.period_cycles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can edit their own cycles" on public.period_cycles;
create policy "Users can edit their own cycles"
on public.period_cycles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own cycles" on public.period_cycles;
create policy "Users can delete their own cycles"
on public.period_cycles for delete
to authenticated
using (auth.uid() = user_id);

-- Anonymous sign-ins must be enabled in:
-- Supabase Dashboard → Authentication → Sign In / Providers → Anonymous Sign-Ins.
