-- Reminder dispatch: every 15 minutes, find users whose local time matches
-- one of their configured check-in reminder times and haven't checked in yet
-- today, then trigger the `send-push` Edge Function for them via pg_net.
--
-- One-time manual setup required after this migration runs (cannot be done
-- from a migration file — needs your actual project URL and service_role key,
-- which only you have access to). Run in the SQL editor:
--
--   select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<your-service-role-key>', 'service_role_key');
--
-- Both values are in Project Settings → API. Never paste the service_role key
-- anywhere outside your own Supabase dashboard/SQL editor.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create schema if not exists app_private;

-- Rows due for a check-in reminder right now, for users who have at least one
-- push subscription and haven't already completed that check-in today.
create or replace function app_private.due_checkin_reminders()
returns table (user_id uuid, title text, body text, url text)
language sql
stable
as $$
  with prefs as (
    select
      np.user_id,
      np.checkin_morning_time,
      np.checkin_evening_time,
      (now() at time zone coalesce(np.timezone, 'UTC')) as local_now
    from public.notification_preferences np
    where exists (select 1 from public.push_subscriptions ps where ps.user_id = np.user_id)
  )
  select
    p.user_id,
    'Buenos días' as title,
    'Hacé tu check-in matutino en Fluiser.' as body,
    '/dashboard' as url
  from prefs p
  where p.checkin_morning_time is not null
    and p.local_now::time >= p.checkin_morning_time
    and p.local_now::time <  p.checkin_morning_time + interval '15 minutes'
    and not exists (
      select 1 from public.checkins c
      where c.user_id = p.user_id and c.type = 'morning' and c.date = p.local_now::date::text
    )
  union all
  select
    p.user_id,
    'Cierre del día',
    '¿Cómo te fue hoy? Hacé tu check-in de la tarde.',
    '/dashboard'
  from prefs p
  where p.checkin_evening_time is not null
    and p.local_now::time >= p.checkin_evening_time
    and p.local_now::time <  p.checkin_evening_time + interval '15 minutes'
    and not exists (
      select 1 from public.checkins c
      where c.user_id = p.user_id and c.type = 'evening' and c.date = p.local_now::date::text
    );
$$;

-- Collects due reminders and fires the send-push Edge Function once with the
-- whole batch. Fire-and-forget (pg_net is async); failures are only visible
-- in the net._http_response table, not retried.
create or replace function app_private.dispatch_reminders()
returns void
language plpgsql
as $$
declare
  v_notifications jsonb;
  v_project_url   text;
  v_service_key   text;
begin
  select jsonb_agg(jsonb_build_object('user_id', r.user_id, 'title', r.title, 'body', r.body, 'url', r.url))
  into v_notifications
  from app_private.due_checkin_reminders() r;

  if v_notifications is null then
    return;
  end if;

  select decrypted_secret into v_project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_project_url is null or v_service_key is null then
    raise notice 'fluiser: project_url / service_role_key not set in Vault, skipping dispatch (see migration 005 header)';
    return;
  end if;

  perform net.http_post(
    url     := v_project_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
    body    := jsonb_build_object('notifications', v_notifications)
  );
end;
$$;

select cron.schedule(
  'fluiser-dispatch-reminders',
  '*/15 * * * *',
  $$select app_private.dispatch_reminders();$$
);
