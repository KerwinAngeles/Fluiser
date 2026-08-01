-- push_subscriptions: one row per subscribed browser/device (Web Push API)
create table public.push_subscriptions (
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now(),
  primary key (endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy "users_own_push_subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notification_preferences: reminder settings, one row per user
create table public.notification_preferences (
  user_id                   uuid not null references auth.users(id) on delete cascade,
  timezone                  text not null default 'UTC',
  habit_reminders_enabled   boolean not null default true,
  checkin_morning_time      time,
  checkin_evening_time      time,
  updated_at                timestamptz not null default now(),
  primary key (user_id)
);
alter table public.notification_preferences enable row level security;
create policy "users_own_notification_preferences" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
