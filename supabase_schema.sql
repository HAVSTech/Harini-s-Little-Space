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

create table if not exists public.shared_relationship_stats (
  id boolean primary key default true check (id = true),
  intimacy_count integer not null default 0 check (intimacy_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_relationship_stats enable row level security;

grant select, insert, update on table public.shared_relationship_stats to authenticated;

drop policy if exists "Authenticated users can view shared relationship stats" on public.shared_relationship_stats;
create policy "Authenticated users can view shared relationship stats"
on public.shared_relationship_stats for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create shared relationship stats" on public.shared_relationship_stats;
create policy "Authenticated users can create shared relationship stats"
on public.shared_relationship_stats for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can edit shared relationship stats" on public.shared_relationship_stats;
create policy "Authenticated users can edit shared relationship stats"
on public.shared_relationship_stats for update
to authenticated
using (true)
with check (true);

insert into public.shared_relationship_stats (id, intimacy_count)
values (true, 0)
on conflict (id) do nothing;

create or replace function public.increment_shared_intimacy()
returns integer
language sql
security invoker
set search_path = public
as $$
  update public.shared_relationship_stats
  set intimacy_count = intimacy_count + 1,
      updated_at = now()
  where id = true
  returning intimacy_count;
$$;

grant execute on function public.increment_shared_intimacy() to authenticated;

-- The old relationship_stats table may remain in an existing project as legacy data.
-- The application no longer reads or writes that table.
