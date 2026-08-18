-- timer_sessions existed only as schema drift (created directly in the
-- dashboard, never checked into a migration) — this catches it up for
-- anyone running migrations from scratch, then adds the pause-tracking
-- columns. Safe to run against the already-existing table too.
create table if not exists public.timer_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  habit_id        text not null,
  date            text not null,
  ts              bigint not null,
  planned_sec     integer not null default 0,
  actual_sec      integer not null default 0,
  energy          text,
  note            text,
  flow_extensions integer not null default 0,
  journey         jsonb not null default '[]'::jsonb
);
create index if not exists timer_sessions_user_habit_idx on public.timer_sessions (user_id, habit_id, ts desc);

alter table public.timer_sessions enable row level security;
drop policy if exists "users_own_timer_sessions" on public.timer_sessions;
create policy "users_own_timer_sessions" on public.timer_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pause analytics: how long, and how many separate times, a session was
-- paused. Derived client-side from `journey` at save time (sum/count of its
-- 'pause' segments) and stored explicitly so it's cheap to aggregate in SQL
-- later instead of unpacking the jsonb journey on every query.
alter table public.timer_sessions add column if not exists paused_sec integer not null default 0;
alter table public.timer_sessions add column if not exists pause_count integer not null default 0;
