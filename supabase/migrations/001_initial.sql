-- habits
create table public.habits (
  id         text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  category   text not null,
  icon       text not null,
  tone       text not null,
  time       text not null,
  freq       text not null,
  timer      jsonb not null default '{"enabled":false,"duration":25,"sessions":4,"breakDuration":5}'::jsonb,
  created_at text not null,
  primary key (user_id, id)
);
alter table public.habits enable row level security;
create policy "users_own_habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- completions
create table public.completions (
  user_id  uuid not null references auth.users(id) on delete cascade,
  key      text not null,   -- habitId|dateYMD
  habit_id text not null,
  date     text not null,   -- YYYY-MM-DD
  energy   text,
  note     text,
  ts       bigint not null,
  primary key (user_id, key)
);
alter table public.completions enable row level security;
create policy "users_own_completions" on public.completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- journal_entries
create table public.journal_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date    text not null,   -- YYYY-MM-DD
  mood    text,
  text    text,
  ts      bigint not null,
  primary key (user_id, date)
);
alter table public.journal_entries enable row level security;
create policy "users_own_journal" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- checkins
create table public.checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null,   -- dateYMD|morning  or  dateYMD|evening
  type    text not null,   -- 'morning' | 'evening'
  date    text not null,   -- YYYY-MM-DD
  data    jsonb not null,
  ts      bigint not null,
  primary key (user_id, key)
);
alter table public.checkins enable row level security;
create policy "users_own_checkins" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
