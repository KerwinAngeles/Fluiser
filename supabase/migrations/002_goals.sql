-- metas
create table public.metas (
  id         text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  deadline   text,
  tone       text not null default 'sky',
  icon       text not null default 'Brain',
  metric     jsonb,
  habit_ids  text[] not null default '{}',
  status     text not null default 'active',
  created_at text not null,
  primary key (user_id, id)
);
alter table public.metas enable row level security;
create policy "users_own_metas" on public.metas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- vision_items
create table public.vision_items (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  emoji       text not null default '✨',
  category    text not null default 'personal',
  tone        text not null default 'sky',
  created_at  text not null,
  primary key (user_id, id)
);
alter table public.vision_items enable row level security;
create policy "users_own_vision_items" on public.vision_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weekly_reviews
create table public.weekly_reviews (
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_key        text not null,
  wins            jsonb not null default '[]'::jsonb,
  challenges      jsonb not null default '[]'::jsonb,
  gratitude       text not null default '',
  next_week_focus text not null default '',
  mood            text,
  ts              bigint not null,
  primary key (user_id, week_key)
);
alter table public.weekly_reviews enable row level security;
create policy "users_own_weekly_reviews" on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
