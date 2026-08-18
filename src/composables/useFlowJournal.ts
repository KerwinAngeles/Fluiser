import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useFluiserStore } from '@/stores/fluiser'
import type { StoredSession, Habit } from '@/types'

export interface SessionRecord extends StoredSession {
  habitId: string
}

const isDemo = () => localStorage.getItem('fluiser_demo_mode') === 'true'

// A streak this long is the commonly-cited rough threshold for a habit
// starting to feel automatic rather than effortful — used only to surface
// "how many of your habits have gotten there", not as a hard rule.
const FORMED_STREAK_DAYS = 21

const DOW_MAP: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' }
function isHabitDueOn(h: Habit, date: Date): boolean {
  return h.freq === 'daily' || h.freq.split(',').map((s) => s.trim()).includes(DOW_MAP[date.getDay()])
}

export function useFlowJournal() {
  const store = useFluiserStore()
  const allSessions = ref<SessionRecord[]>([])
  const loading = ref(false)
  const activeFilter = ref<string | null>(null)

  async function load() {
    loading.value = true
    try {
      if (isDemo()) {
        const records: SessionRecord[] = []
        for (const h of store.data.habits) {
          if (!h.timer?.enabled) continue
          try {
            const raw = localStorage.getItem(`fluiser_sessions_${h.id}`)
            if (!raw) continue
            for (const s of JSON.parse(raw) as StoredSession[]) records.push({ ...s, habitId: h.id })
          } catch {}
        }
        allSessions.value = records.sort((a, b) => b.ts - a.ts)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('ts', { ascending: false })
        .limit(300)
      allSessions.value = (data ?? []).map((r) => ({
        habitId: r.habit_id,
        date: r.date,
        ts: r.ts,
        plannedSec: r.planned_sec,
        actualSec: r.actual_sec,
        energy: r.energy,
        note: r.note ?? '',
        flowExtensions: r.flow_extensions ?? 0,
        pausedSec: r.paused_sec ?? 0,
        pauseCount: r.pause_count ?? 0,
        journey: r.journey ?? [],
      }))
    } finally {
      loading.value = false
    }
  }

  const filtered = computed(() =>
    activeFilter.value
      ? allSessions.value.filter((s) => s.habitId === activeFilter.value)
      : allSessions.value
  )

  const byDate = computed(() => {
    const groups = new Map<string, SessionRecord[]>()
    for (const s of filtered.value) {
      const g = groups.get(s.date) ?? []
      g.push(s)
      groups.set(s.date, g)
    }
    return [...groups.entries()].map(([date, sessions]) => ({ date, sessions }))
  })

  const habitStats = computed(() => {
    const weekAgo = Date.now() - 7 * 86400000
    const map = new Map<string, { totalSec: number; count: number; weekSec: number; weekPauseCount: number }>()
    for (const s of allSessions.value) {
      const e = map.get(s.habitId) ?? { totalSec: 0, count: 0, weekSec: 0, weekPauseCount: 0 }
      e.totalSec += s.actualSec
      e.count++
      if (s.ts >= weekAgo) { e.weekSec += s.actualSec; e.weekPauseCount += s.pauseCount }
      map.set(s.habitId, e)
    }
    return map
  })

  // The habit that ate the most pauses this week — a candidate for "this
  // timer/slot doesn't actually fit how the day goes", not necessarily a
  // bad habit.
  const topPausedHabitId = computed(() => {
    let best: string | null = null
    let bestCount = 0
    for (const [id, s] of habitStats.value) {
      if (s.weekPauseCount > bestCount) { best = id; bestCount = s.weekPauseCount }
    }
    return best
  })

  const weekStats = computed(() => {
    const weekAgo = Date.now() - 7 * 86400000
    const prevAgo = weekAgo - 7 * 86400000
    let weekSec = 0, prevSec = 0, weekCount = 0, flowSec = 0
    let weekPausedSec = 0, weekPauseCount = 0, prevPausedSec = 0, cleanCount = 0
    for (const s of allSessions.value) {
      if (s.ts >= weekAgo) {
        weekSec += s.actualSec; weekCount++
        flowSec += s.flowExtensions * 5 * 60
        weekPausedSec += s.pausedSec
        weekPauseCount += s.pauseCount
        if (s.pauseCount === 0) cleanCount++
      } else if (s.ts >= prevAgo) {
        prevSec += s.actualSec
        prevPausedSec += s.pausedSec
      }
    }
    const trend = prevSec > 0 ? Math.round(((weekSec - prevSec) / prevSec) * 100) : null
    // Share of total session time (focus + paused) actually spent paused —
    // a steadier read on interruption than the raw minute count, since it's
    // relative to how much you actually sat down to begin with.
    const pauseRatio = weekSec + weekPausedSec > 0 ? weekPausedSec / (weekSec + weekPausedSec) : 0
    const pauseTrend = prevPausedSec > 0 ? Math.round(((weekPausedSec - prevPausedSec) / prevPausedSec) * 100) : null
    const cleanPct = weekCount > 0 ? cleanCount / weekCount : 0
    return { weekSec, weekCount, flowSec, trend, weekPausedSec, weekPauseCount, pauseRatio, pauseTrend, cleanPct, cleanCount }
  })

  // Is the app actually helping? Two independent reads: are you completing
  // more of what's due lately (trailing 4 weeks vs the 4 before that), and
  // how many habits have crossed into "probably automatic by now" territory.
  const CONSISTENCY_WEEKS = 4
  function completionPctForWeekRange(startWeeksAgo: number, weeks: number): number {
    const now = new Date()
    let due = 0, done = 0
    for (let w = startWeeksAgo; w < startWeeksAgo + weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(now)
        date.setDate(now.getDate() - 7 * w - d)
        if (date > now) continue
        const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        for (const h of store.data.habits) {
          if (h.active === false) continue
          if (new Date(ds) < new Date(h.createdAt)) continue
          if (isHabitDueOn(h, date)) {
            due++
            if (store.data.completions[`${h.id}|${ds}`]) done++
          }
        }
      }
    }
    return due ? done / due : 0
  }

  const progressStats = computed(() => {
    const recentPct = completionPctForWeekRange(0, CONSISTENCY_WEEKS)
    const priorPct = completionPctForWeekRange(CONSISTENCY_WEEKS, CONSISTENCY_WEEKS)
    const consistencyTrend = priorPct > 0 ? Math.round(((recentPct - priorPct) / priorPct) * 100) : null
    const activeHabits = store.data.habits.filter((h) => h.active !== false)
    const formedHabits = activeHabits.filter((h) => store.streakOf(h.id).current >= FORMED_STREAK_DAYS)
    return {
      recentPct,
      consistencyTrend,
      formedCount: formedHabits.length,
      totalHabits: activeHabits.length,
      formedStreakDays: FORMED_STREAK_DAYS,
    }
  })

  return {
    allSessions, loading, activeFilter, filtered, byDate,
    habitStats, weekStats, topPausedHabitId, progressStats, load,
  }
}
