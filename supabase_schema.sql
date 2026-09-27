-- Harini's Little Space
-- Run this once in Supabase SQL Editor for the current shared-history architecture.
--
-- Cycle history is intentionally shared across authenticated/anonymous sessions.
-- It does not belong to an individual auth user.

create table if not exists public.shared_period_cycles (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_start_time time,
  period_end date,
  created_at timestamptz not null default now(),
  constraint shared_period_end_after_start check (period_end is null or period_end >= period_start),
  constraint shared_period_cycles_unique unique nulls not distinct (period_start, period_start_time, period_end)
);

create index if not exists shared_period_cycles_start_idx
  on public.shared_period_cycles(period_start desc, period_start_time desc);

alter table public.shared_period_cycles enable row level security;

grant select, insert, update, delete on table public.shared_period_cycles to authenticated;

drop policy if exists "Authenticated users can view shared cycle history" on public.shared_period_cycles;
create policy "Authenticated users can view shared cycle history"
on public.shared_period_cycles for select
to authenticated
using (true);

drop policy if exists "Authenticated users can add shared cycle history" on public.shared_period_cycles;
create policy "Authenticated users can add shared cycle history"
on public.shared_period_cycles for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can edit shared cycle history" on public.shared_period_cycles;
create policy "Authenticated users can edit shared cycle history"
on public.shared_period_cycles for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete shared cycle history" on public.shared_period_cycles;
create policy "Authenticated users can delete shared cycle history"
on public.shared_period_cycles for delete
to authenticated
using (true);

-- The old period_cycles table may remain in an existing project as legacy data.
-- The application no longer reads or writes that table.

create table if not exists public.relationship_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  intimacy_count integer not null default 0 check (intimacy_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists relationship_stats_user_idx
  on public.relationship_stats(user_id);

alter table public.relationship_stats enable row level security;

drop policy if exists "Users can view their own relationship stats" on public.relationship_stats;
create policy "Users can view their own relationship stats"
on public.relationship_stats for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can add their own relationship stats" on public.relationship_stats;
create policy "Users can add their own relationship stats"
on public.relationship_stats for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can edit their own relationship stats" on public.relationship_stats;
create policy "Users can edit their own relationship stats"
on public.relationship_stats for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
