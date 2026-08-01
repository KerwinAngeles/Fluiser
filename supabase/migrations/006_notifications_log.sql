-- notifications: in-app notification feed (bell icon), one row per notification
-- ever sent to a user. Populated by the `send-push` Edge Function whenever it
-- dispatches a reminder, independent of whether the push itself was delivered
-- (e.g. permission denied, no subscription, or the device was offline).
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text not null,
  url        text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "users_own_notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
