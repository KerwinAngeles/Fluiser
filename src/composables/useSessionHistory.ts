import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { StoredSession } from '@/types'

const MAX = 60
const LOCAL_KEY = (id: string) => `fluiser_sessions_${id}`
const isDemo = () => localStorage.getItem('fluiser_demo_mode') === 'true'

export function useSessionHistory(habitId: string) {
  const sessions = ref<StoredSession[]>([])
  const loading = ref(false)

  async function load() {
    if (isDemo()) {
      try { sessions.value = JSON.parse(localStorage.getItem(LOCAL_KEY(habitId)) ?? '[]') } catch { sessions.value = [] }
      return
    }
    loading.value = true
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('habit_id', habitId)
        .order('ts', { ascending: false })
        .limit(MAX)
      sessions.value = (data ?? []).map((r) => ({
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

  async function addSession(session: StoredSession) {
    if (isDemo()) {
      try {
        const all: StoredSession[] = JSON.parse(localStorage.getItem(LOCAL_KEY(habitId)) ?? '[]')
        all.unshift(session)
        if (all.length > MAX) all.splice(MAX)
        localStorage.setItem(LOCAL_KEY(habitId), JSON.stringify(all))
      } catch {}
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('timer_sessions').insert({
      user_id: user.id,
      habit_id: habitId,
      date: session.date,
      ts: session.ts,
      planned_sec: session.plannedSec,
      actual_sec: session.actualSec,
      energy: session.energy,
      note: session.note,
      flow_extensions: session.flowExtensions,
      paused_sec: session.pausedSec,
      pause_count: session.pauseCount,
      journey: session.journey,
    })
    if (error) console.error('addSession', error)
  }

  async function clearSessions() {
    if (isDemo()) {
      localStorage.removeItem(LOCAL_KEY(habitId))
      sessions.value = []
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('timer_sessions').delete().eq('user_id', user.id).eq('habit_id', habitId)
    sessions.value = []
  }

  return { sessions, loading, load, addSession, clearSessions }
}
