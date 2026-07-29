import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useFluiserStore } from '@/stores/fluiser'
import type { StoredSession } from '@/types'

export interface SessionRecord extends StoredSession {
  habitId: string
}

const isDemo = () => localStorage.getItem('fluiser_demo_mode') === 'true'

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
    const map = new Map<string, { totalSec: number; count: number; weekSec: number }>()
    for (const s of allSessions.value) {
      const e = map.get(s.habitId) ?? { totalSec: 0, count: 0, weekSec: 0 }
      e.totalSec += s.actualSec
      e.count++
      if (s.ts >= weekAgo) e.weekSec += s.actualSec
      map.set(s.habitId, e)
    }
    return map
  })

  const weekStats = computed(() => {
    const weekAgo = Date.now() - 7 * 86400000
    const prevAgo = weekAgo - 7 * 86400000
    let weekSec = 0, prevSec = 0, weekCount = 0, flowSec = 0
    for (const s of allSessions.value) {
      if (s.ts >= weekAgo) {
        weekSec += s.actualSec; weekCount++
        flowSec += s.flowExtensions * 5 * 60
      } else if (s.ts >= prevAgo) {
        prevSec += s.actualSec
      }
    }
    const trend = prevSec > 0 ? Math.round(((weekSec - prevSec) / prevSec) * 100) : null
    return { weekSec, weekCount, flowSec, trend }
  })

  return { allSessions, loading, activeFilter, filtered, byDate, habitStats, weekStats, load }
}
