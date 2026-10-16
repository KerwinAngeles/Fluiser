import { supabase } from '@/lib/supabase'
import type { Habit, Completion, JournalEntry, Checkin, Meta, VisionItem, WeeklyReview, NotificationPreferences } from '@/types'

export interface UserData {
  habits: Habit[]
  completions: Record<string, Completion>
  journal: Record<string, JournalEntry | undefined>
  checkins: Record<string, Checkin>
}

export async function loadUserData(userId: string): Promise<UserData> {
  const [habitsRes, completionsRes, journalRes, checkinsRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('completions').select('*').eq('user_id', userId),
    supabase.from('journal_entries').select('*').eq('user_id', userId),
    supabase.from('checkins').select('*').eq('user_id', userId),
  ])

  const habits: Habit[] = (habitsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    icon: r.icon,
    tone: r.tone,
    time: r.time,
    freq: r.freq,
    timer: r.timer,
    createdAt: r.created_at,
    active: r.active ?? true,
  }))

  const completions: Record<string, Completion> = {}
  for (const r of completionsRes.data ?? []) {
    completions[r.key] = { energy: r.energy, note: r.note ?? '', ts: r.ts }
  }

  const journal: Record<string, JournalEntry | undefined> = {}
  for (const r of journalRes.data ?? []) {
    journal[r.date] = { mood: r.mood, text: r.text, ts: r.ts }
  }

  const checkins: Record<string, Checkin> = {}
  for (const r of checkinsRes.data ?? []) {
    checkins[r.key] = { ...r.data, ts: r.ts }
  }

  return { habits, completions, journal, checkins }
}

export async function upsertHabit(userId: string, habit: Habit): Promise<void> {
  const { error } = await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    category: habit.category,
    icon: habit.icon,
    tone: habit.tone,
    time: habit.time,
    freq: habit.freq,
    timer: habit.timer,
    created_at: habit.createdAt,
    active: habit.active,
  })
  if (error) console.error('upsertHabit', error)
}

export async function upsertCompletion(userId: string, key: string, completion: Completion): Promise<void> {
  const [habitId, date] = key.split('|')
  const { error } = await supabase.from('completions').upsert({
    user_id: userId,
    key,
    habit_id: habitId,
    date,
    energy: completion.energy,
    note: completion.note,
    ts: completion.ts,
  })
  if (error) console.error('upsertCompletion', error)
}

export async function deleteCompletion(userId: string, key: string): Promise<void> {
  const { error } = await supabase.from('completions').delete().eq('user_id', userId).eq('key', key)
  if (error) console.error('deleteCompletion', error)
}

export async function upsertJournalEntry(userId: string, date: string, entry: JournalEntry): Promise<void> {
  const { error } = await supabase.from('journal_entries').upsert({
    user_id: userId,
    date,
    mood: entry.mood,
    text: entry.text,
    ts: entry.ts,
  })
  if (error) console.error('upsertJournalEntry', error)
}

export async function deleteJournalEntry(userId: string, date: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('user_id', userId).eq('date', date)
  if (error) console.error('deleteJournalEntry', error)
}

export async function upsertCheckin(userId: string, key: string, checkin: Checkin): Promise<void> {
  const [date, type] = key.split('|')
  const { ts, ...data } = checkin as Checkin & { ts: number }
  const { error } = await supabase.from('checkins').upsert({
    user_id: userId,
    key,
    type,
    date,
    data,
    ts,
  })
  if (error) console.error('upsertCheckin', error)
}

export async function loadMetas(userId: string): Promise<Meta[]> {
  const { data } = await supabase.from('metas').select('*').eq('user_id', userId)
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    deadline: r.deadline ?? undefined,
    tone: r.tone,
    icon: r.icon,
    metric: r.metric ?? undefined,
    habitIds: r.habit_ids ?? [],
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function upsertMeta(userId: string, meta: Meta): Promise<void> {
  const { error } = await supabase.from('metas').upsert({
    id: meta.id,
    user_id: userId,
    title: meta.title,
    deadline: meta.deadline ?? null,
    tone: meta.tone,
    icon: meta.icon,
    metric: meta.metric ?? null,
    habit_ids: meta.habitIds,
    status: meta.status,
    created_at: meta.createdAt,
  })
  if (error) console.error('upsertMeta', error)
}

export async function deleteMeta(userId: string, metaId: string): Promise<void> {
  const { error } = await supabase.from('metas').delete().eq('user_id', userId).eq('id', metaId)
  if (error) console.error('deleteMeta', error)
}

export async function loadVisionItems(userId: string): Promise<VisionItem[]> {
  const { data } = await supabase.from('vision_items').select('*').eq('user_id', userId)
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    emoji: r.emoji,
    category: r.category,
    tone: r.tone,
    createdAt: r.created_at,
  }))
}

export async function upsertVisionItem(userId: string, item: VisionItem): Promise<void> {
  const { error } = await supabase.from('vision_items').upsert({
    id: item.id,
    user_id: userId,
    title: item.title,
    description: item.description ?? null,
    emoji: item.emoji,
    category: item.category,
    tone: item.tone,
    created_at: item.createdAt,
  })
  if (error) console.error('upsertVisionItem', error)
}

export async function deleteVisionItem(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase.from('vision_items').delete().eq('user_id', userId).eq('id', itemId)
  if (error) console.error('deleteVisionItem', error)
}

export async function loadWeeklyReviews(userId: string): Promise<Record<string, WeeklyReview>> {
  const { data } = await supabase.from('weekly_reviews').select('*').eq('user_id', userId)
  const result: Record<string, WeeklyReview> = {}
  for (const r of data ?? []) {
    result[r.week_key] = {
      weekKey: r.week_key,
      wins: r.wins ?? [],
      challenges: r.challenges ?? [],
      gratitude: r.gratitude ?? '',
      nextWeekFocus: r.next_week_focus ?? '',
      mood: r.mood,
      ts: r.ts,
    }
  }
  return result
}

export async function upsertWeeklyReview(userId: string, review: WeeklyReview): Promise<void> {
  const { error } = await supabase.from('weekly_reviews').upsert({
    user_id: userId,
    week_key: review.weekKey,
    wins: review.wins,
    challenges: review.challenges,
    gratitude: review.gratitude,
    next_week_focus: review.nextWeekFocus,
    mood: review.mood,
    ts: review.ts,
  })
  if (error) console.error('upsertWeeklyReview', error)
}

export interface PushSubscriptionKeys {
  endpoint: string
  p256dh: string
  authKey: string
}

export async function savePushSubscription(userId: string, sub: PushSubscriptionKeys): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth_key: sub.authKey,
  })
  if (error) console.error('savePushSubscription', error)
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) console.error('deletePushSubscription', error)
}

export async function loadNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('loadNotificationPreferences', error)
    return null
  }
  if (!data) return null
  return {
    timezone: data.timezone,
    habitRemindersEnabled: data.habit_reminders_enabled,
    checkinMorningTime: data.checkin_morning_time ?? undefined,
    checkinEveningTime: data.checkin_evening_time ?? undefined,
  }
}

export async function upsertNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
  const { error } = await supabase.from('notification_preferences').upsert({
    user_id: userId,
    timezone: prefs.timezone,
    habit_reminders_enabled: prefs.habitRemindersEnabled,
    checkin_morning_time: prefs.checkinMorningTime ?? null,
    checkin_evening_time: prefs.checkinEveningTime ?? null,
    updated_at: new Date().toISOString(),
  })
  if (error) console.error('upsertNotificationPreferences', error)
}
