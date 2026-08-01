// Sends Web Push notifications for a batch of users. Called internally by the
// `dispatch_reminders` pg_cron job (via pg_net) — never exposed to the client.
//
// Required secrets (set with `supabase secrets set`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically by the platform.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@fluiser.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

interface NotificationRequest {
  user_id: string
  title: string
  body: string
  url?: string
}

interface PushSubscriptionRow {
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

// Only the service_role key (never exposed to clients) may trigger sends —
// this function can push arbitrary content to arbitrary users, so a caller
// that merely holds a valid user/anon key must be rejected. Compared directly
// against the platform-injected secret rather than decoded as a JWT, since
// projects on Supabase's newer API key format (sb_secret_...) aren't JWTs.
function isServiceRoleCall(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice('Bearer '.length)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return !!serviceRoleKey && token === serviceRoleKey
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 })
  }
  if (!isServiceRoleCall(req.headers.get('Authorization'))) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  let notifications: NotificationRequest[]
  try {
    const payload = await req.json()
    notifications = payload.notifications
    if (!Array.isArray(notifications) || notifications.length === 0) throw new Error('empty')
  } catch {
    return new Response(JSON.stringify({ error: 'body must be { notifications: [...] }' }), { status: 400 })
  }

  const userIds = [...new Set(notifications.map((n) => n.user_id))]
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth_key')
    .in('user_id', userIds)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const subsByUser = new Map<string, PushSubscriptionRow[]>()
  for (const sub of (subs ?? []) as PushSubscriptionRow[]) {
    const list = subsByUser.get(sub.user_id) ?? []
    list.push(sub)
    subsByUser.set(sub.user_id, list)
  }

  // Log every notification to the in-app feed regardless of push delivery
  // outcome, so the bell icon reflects reminders even if the push itself
  // failed (denied permission, stale subscription, offline device, etc.)
  await supabaseAdmin.from('notifications').insert(
    notifications.map((n) => ({ user_id: n.user_id, title: n.title, body: n.body, url: n.url ?? null })),
  )

  const results = { sent: 0, failed: 0, removedStale: 0 }

  await Promise.all(
    notifications.flatMap((n) =>
      (subsByUser.get(n.user_id) ?? []).map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        }
        const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url ?? '/' })
        try {
          await webpush.sendNotification(pushSubscription, payload)
          results.sent++
        } catch (err) {
          results.failed++
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            // Subscription no longer valid on the push service — clean it up.
            await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            results.removedStale++
          } else {
            console.error('send-push: sendNotification failed', sub.endpoint, err)
          }
        }
      }),
    ),
  )

  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } })
})
