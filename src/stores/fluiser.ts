import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import * as db from '@/services/supabase'
import type { Habit, Completion, JournalEntry, Checkin, StoreData, StreakInfo, HeatmapCell, Energy, AppSettings, Meta, VisionItem, WeeklyReview } from '@/types'
import { CATEGORIES } from '@/types'
import { todayRef } from '@/composables/useToday'

const TIMER_STORAGE_KEY = 'fluiser_timer'

interface TimerSegment {
  type: 'work' | 'pause' | 'break' | 'flow'
  startAt: number
  endAt?: number
}

interface TimerState {
  habitId: string
  phase: 'work' | 'break' | 'review' | 'flow-check'
  currentSession: number
  remaining: number
  endAt: number | null   // wall-clock ms when current phase ends; null when paused/review
  paused: boolean
  workSec: number
  breakSec: number
  sessions: number
  flowExtensions: number  // how many 5-min flow blocks were added
  journey: TimerSegment[]
}

const today = () => new Date()
export const ymd = (d?: Date | string): string => {
  const dt = d instanceof Date ? d : d ? new Date(d) : new Date()
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)
export const startOfWeek = (d: Date): Date => {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

const DOW_MAP: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' }

function isHabitDue(habit: Habit, date: Date): boolean {
  const dow = DOW_MAP[date.getDay()]
  return habit.freq === 'daily' || habit.freq.split(',').map((s) => s.trim()).includes(dow)
}

const emptyData = (): StoreData => ({
  habits: [],
  completions: {},
  journal: {},
  checkins: {},
  settings: { onboarded: false },
  focusOn: false,
  metas: [],
  visionItems: [],
  weeklyReviews: {},
})

export const useFluiserStore = defineStore('fluiser', () => {
  const data = ref<StoreData>(emptyData())
  const timerState = ref<TimerState | null>(null)
  const timerMinimized = ref(false)
  const loading = ref(false)
  let _timerInterval: ReturnType<typeof setInterval> | null = null

  // Derived from timerState — replaces the old activeTimer ref
  const activeTimer = computed((): Habit | null => {
    if (!timerState.value) return null
    return data.value.habits.find(h => h.id === timerState.value!.habitId) ?? null
  })

  function _playBell() {
    try {
      const ctx = new AudioContext()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 660; o.type = 'sine'
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4)
      o.connect(g); g.connect(ctx.destination)
      o.start(); o.stop(ctx.currentTime + 1.5)
      setTimeout(() => ctx.close(), 1600)
    } catch {}
  }

  function _saveTimer() {
    if (timerState.value) localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState.value))
    else localStorage.removeItem(TIMER_STORAGE_KEY)
  }

  const FLOW_CHECK_SEC = 12

  function _advancePhase() {
    const s = timerState.value
    if (!s) return
    _playBell()
    const now = Date.now()
    const sc = _closeSegment(s)
    if (s.phase === 'work') {
      if (s.currentSession >= s.sessions) {
        timerState.value = { ...sc, phase: 'flow-check', remaining: FLOW_CHECK_SEC, endAt: now + FLOW_CHECK_SEC * 1000 }
      } else if (s.breakSec > 0) {
        timerState.value = { ...sc, phase: 'break', remaining: s.breakSec, endAt: now + s.breakSec * 1000, journey: [...sc.journey, { type: 'break' as const, startAt: now }] }
      } else {
        timerState.value = { ...sc, currentSession: s.currentSession + 1, remaining: s.workSec, endAt: now + s.workSec * 1000, journey: [...sc.journey, { type: 'work' as const, startAt: now }] }
      }
    } else if (s.phase === 'break') {
      timerState.value = { ...sc, phase: 'work', currentSession: s.currentSession + 1, remaining: s.workSec, endAt: now + s.workSec * 1000, journey: [...sc.journey, { type: 'work' as const, startAt: now }] }
    }
    _saveTimer()
  }

  function _tick() {
    const s = timerState.value
    if (!s || s.paused || s.phase === 'review' || !s.endAt) return
    const now = Date.now()
    if (now >= s.endAt) {
      if (s.phase === 'flow-check') {
        timerState.value = { ..._closeSegment(s), phase: 'review', remaining: 0, endAt: null }
        if (timerMinimized.value) timerMinimized.value = false
        _saveTimer()
      } else {
        _advancePhase()
      }
    } else {
      s.remaining = Math.ceil((s.endAt - now) / 1000)
    }
  }

  function _fastForward(s: TimerState): TimerState {
    if (s.paused || !s.endAt || s.phase === 'review') return s
    // If restoring in flow-check: keep if still live, else go to review
    if (s.phase === 'flow-check') {
      if (Date.now() >= s.endAt) return { ...s, phase: 'review', remaining: 0, endAt: null }
      return { ...s, remaining: Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000)) }
    }
    let { phase, currentSession, workSec, breakSec, sessions, endAt } = s
    const now = Date.now()
    while (now >= endAt && phase !== 'review') {
      if (phase === 'work') {
        if (currentSession >= sessions) { phase = 'review'; break }
        else if (breakSec > 0) { endAt += breakSec * 1000; phase = 'break' }
        else { currentSession++; endAt += workSec * 1000 }
      } else { currentSession++; phase = 'work'; endAt += workSec * 1000 }
    }
    if (phase === 'review') return { ...s, phase, currentSession, remaining: 0, endAt: null }
    return { ...s, phase, currentSession, remaining: Math.max(0, Math.ceil((endAt - now) / 1000)), endAt }
  }

  function restoreTimerFromStorage() {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY)
      if (!raw) return
      let s = JSON.parse(raw) as TimerState
      if (!data.value.habits.find(h => h.id === s.habitId)) {
        localStorage.removeItem(TIMER_STORAGE_KEY); return
      }
      if (!s.paused && s.endAt) s = _fastForward(s)
      timerState.value = s
      timerMinimized.value = true
      if (!s.paused && s.phase !== 'review') {
        if (_timerInterval) clearInterval(_timerInterval)
        _timerInterval = setInterval(_tick, 500)
      }
    } catch { localStorage.removeItem(TIMER_STORAGE_KEY) }
  }

  function _closeSegment(s: TimerState): TimerState {
    if (!s.journey.length) return s
    const last = s.journey[s.journey.length - 1]
    if (last.endAt) return s
    return { ...s, journey: [...s.journey.slice(0, -1), { ...last, endAt: Date.now() }] }
  }

  function _lastActiveSegType(journey: TimerSegment[]): TimerSegment['type'] {
    for (let i = journey.length - 1; i >= 0; i--) {
      if (journey[i].type !== 'pause') return journey[i].type
    }
    return 'work'
  }

  function update(mut: (d: StoreData) => StoreData | void) {
    const copy = JSON.parse(JSON.stringify(data.value)) as StoreData
    const result = mut(copy)
    data.value = (result ?? copy) as StoreData
  }

  async function init(userId: string) {
    loading.value = true
    try {
      if (userId === 'demo-user-id') {
        const todayVal = today()
        const habitsList: Habit[] = [
          {
            id: 'demo-med',
            name: 'Meditar 10 min',
            category: 'mente',
            icon: 'Brain',
            tone: 'sky',
            time: '07:00',
            freq: 'daily',
            timer: { enabled: true, duration: 600, sessions: 1, breakDuration: 0 },
            createdAt: ymd(addDays(todayVal, -30)),
          },
          {
            id: 'demo-water',
            name: 'Beber 2L de agua',
            category: 'cuerpo',
            icon: 'Water',
            tone: 'sky',
            time: '08:00',
            freq: 'daily',
            timer: { enabled: false, duration: 0, sessions: 1, breakDuration: 0 },
            createdAt: ymd(addDays(todayVal, -30)),
          },
          {
            id: 'demo-write',
            name: 'Escribir 200 palabras',
            category: 'creacion',
            icon: 'Pen',
            tone: 'lilac',
            time: '09:00',
            freq: 'daily',
            timer: { enabled: true, duration: 1200, sessions: 1, breakDuration: 0 },
            createdAt: ymd(addDays(todayVal, -30)),
          },
          {
            id: 'demo-walk',
            name: 'Caminata al aire libre',
            category: 'descanso',
            icon: 'Leaf',
            tone: 'mint',
            time: '17:00',
            freq: 'daily',
            timer: { enabled: false, duration: 0, sessions: 1, breakDuration: 0 },
            createdAt: ymd(addDays(todayVal, -30)),
          },
        ]

        const completionsList: Record<string, Completion> = {}
        const journalList: Record<string, JournalEntry | undefined> = {}
        const checkinsList: Record<string, Checkin> = {}

        // Pre-fill completions, journal and checkins for last 30 days
        for (let i = 30; i >= 0; i--) {
          const dStr = ymd(addDays(todayVal, -i))
          const ts = Date.now() - i * 86400000

          // Meditar: 85% completion
          if (i !== 3 && i !== 12 && i !== 18 && i !== 25) {
            completionsList[`demo-med|${dStr}`] = { energy: 'easy', note: 'Calma mental total', ts }
          }
          // Water: 92% completion
          if (i !== 7 && i !== 15 && i !== 22) {
            completionsList[`demo-water|${dStr}`] = { energy: 'auto', note: '', ts }
          }
          // Write: 70% completion
          if (i % 3 !== 0) {
            completionsList[`demo-write|${dStr}`] = { energy: 'effort', note: 'Buen avance en mis ideas', ts }
          }
          // Walk: 75% completion
          if (i % 4 !== 0) {
            completionsList[`demo-walk|${dStr}`] = { energy: 'easy', note: 'Tarde despejada', ts }
          }

          // Pre-fill journal entry every few days
          if (i % 5 === 0) {
            journalList[dStr] = {
              mood: i % 10 === 0 ? 'great' : 'good',
              text: 'Día productivo y balanceado. Logré mantener mi enfoque y mis hábitos sin esfuerzo. Me siento con mucha energía.',
              ts,
            }
          }

          // Pre-fill checkins for morning/evening on some days
          if (i % 3 === 0) {
            checkinsList[`${dStr}|morning`] = {
              energy: 4,
              intention: 'Mantener la presencia y la paciencia durante las tareas.',
              ts,
            } as any
            checkinsList[`${dStr}|evening`] = {
              reflection: 'Logré mis metas diarias y pasé tiempo descansando.',
              gratitude: 'Agradecido por el clima agradable y una buena lectura.',
              ts,
            } as any
          }
        }

        data.value = {
          habits: habitsList,
          completions: completionsList,
          journal: journalList,
          checkins: checkinsList,
          settings: { onboarded: true, name: 'Usuario Demo' },
          focusOn: false,
          metas: [
            {
              id: 'demo-meta-1',
              title: 'Lanzar FluiserApp',
              deadline: `${todayVal.getFullYear()}-12-31`,
              tone: 'sky',
              icon: 'Bolt',
              metric: { label: 'Usuarios activos', target: 100, current: 12, unit: 'usuarios' },
              habitIds: ['demo-write'],
              status: 'active',
              createdAt: ymd(addDays(todayVal, -30)),
            },
            {
              id: 'demo-meta-2',
              title: 'Correr un maratón',
              deadline: `${todayVal.getFullYear() + 1}-04-01`,
              tone: 'amber',
              icon: 'Run',
              metric: { label: 'Kilómetros semanales', target: 42, current: 18, unit: 'km' },
              habitIds: ['demo-walk'],
              status: 'active',
              createdAt: ymd(addDays(todayVal, -15)),
            },
          ],
          visionItems: [
            { id: 'demo-vis-1', title: 'Vivir cerca del mar', emoji: '🌊', category: 'personal', tone: 'sky', createdAt: ymd(addDays(todayVal, -10)) },
            { id: 'demo-vis-2', title: 'Startup propia rentable', emoji: '🚀', category: 'carrera', tone: 'lilac', createdAt: ymd(addDays(todayVal, -10)) },
            { id: 'demo-vis-3', title: 'Cuerpo sano y fuerte', emoji: '💪', category: 'salud', tone: 'mint', createdAt: ymd(addDays(todayVal, -8)) },
            { id: 'demo-vis-4', title: 'Familia en paz', emoji: '🏡', category: 'relaciones', tone: 'rose', createdAt: ymd(addDays(todayVal, -5)) },
          ],
          weeklyReviews: {},
        }
        restoreTimerFromStorage()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const meta = user?.user_metadata ?? {}
      const [userData, metas, visionItems, weeklyReviews] = await Promise.all([
        db.loadUserData(userId),
        db.loadMetas(userId),
        db.loadVisionItems(userId),
        db.loadWeeklyReviews(userId),
      ])
      data.value = {
        habits: userData.habits,
        completions: userData.completions,
        journal: userData.journal,
        checkins: userData.checkins,
        settings: {
          onboarded: userData.habits.length > 0,
          name: meta.fluiser_name || meta.full_name || meta.name || '',
        },
        focusOn: false,
        metas,
        visionItems,
        weeklyReviews,
      }
      restoreTimerFromStorage()
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = emptyData()
    stopTimer()
  }

  function isDone(habitId: string, date = ymd()): boolean {
    return !!data.value.completions[`${habitId}|${date}`]
  }

  function completion(habitId: string, date = ymd()): Completion | undefined {
    return data.value.completions[`${habitId}|${date}`]
  }

  async function toggleHabit(habitId: string, date = ymd(), payload: Partial<Completion> = {}) {
    const key = `${habitId}|${date}`
    const wasCompleted = !!data.value.completions[key]
    // Optimistic local update first — UI responds immediately
    update((d) => {
      if (d.completions[key]) delete d.completions[key]
      else d.completions[key] = { energy: payload.energy ?? 'auto', note: payload.note ?? '', ts: Date.now() }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (wasCompleted) {
      await db.deleteCompletion(user.id, key)
    } else {
      await db.upsertCompletion(user.id, key, data.value.completions[key])
    }
  }

  async function setEnergy(habitId: string, energy: Energy, date = ymd()) {
    const key = `${habitId}|${date}`
    update((d) => {
      if (!d.completions[key]) d.completions[key] = { energy: 'auto', note: '', ts: Date.now() }
      d.completions[key].energy = energy
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (user && data.value.completions[key]) {
      await db.upsertCompletion(user.id, key, data.value.completions[key])
    }
  }

  async function setNote(habitId: string, note: string, date = ymd()) {
    const key = `${habitId}|${date}`
    update((d) => {
      if (!d.completions[key]) d.completions[key] = { energy: 'auto', note: '', ts: Date.now() }
      d.completions[key].note = note
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (user && data.value.completions[key]) {
      await db.upsertCompletion(user.id, key, data.value.completions[key])
    }
  }

  async function upsertHabit(h: Partial<Habit> & { id: string }) {
    // Local update first — habit appears in dashboard immediately
    update((d) => {
      const idx = d.habits.findIndex((x) => x.id === h.id)
      if (idx >= 0) d.habits[idx] = { ...d.habits[idx], ...h }
      else d.habits.push({ ...h, createdAt: ymd() } as Habit)
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const habit = data.value.habits.find((x) => x.id === h.id)
    if (habit) await db.upsertHabit(user.id, habit)
  }

  async function deleteHabit(id: string) {
    // Local update first — habit removed from UI immediately
    update((d) => {
      d.habits = d.habits.filter((h) => h.id !== id)
      for (const k of Object.keys(d.completions)) {
        if (k.startsWith(id + '|')) delete d.completions[k]
      }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await db.deleteHabit(user.id, id)
    const { error } = await supabase.from('completions').delete().eq('user_id', user.id).eq('habit_id', id)
    if (error) console.error('deleteHabitCompletions', error)
  }

  async function writeJournal(date: string, entry: Partial<JournalEntry> | null) {
    const isEmpty = !entry || (!entry.text && !entry.mood)
    update((d) => {
      if (isEmpty) {
        d.journal[date] = undefined
      } else {
        d.journal[date] = { ...(d.journal[date] ?? {}), ...entry, ts: Date.now() } as JournalEntry
      }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (isEmpty) {
      await db.deleteJournalEntry(user.id, date)
    } else if (data.value.journal[date]) {
      await db.upsertJournalEntry(user.id, date, data.value.journal[date]!)
    }
  }

  async function writeCheckin(date: string, kind: 'morning' | 'evening', entry: Partial<Checkin>) {
    const key = `${date}|${kind}`
    update((d) => {
      d.checkins[key] = { ...entry, ts: Date.now() } as Checkin
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await db.upsertCheckin(user.id, key, data.value.checkins[key])
  }

  async function writeSettings(partial: Partial<AppSettings>) {
    update((d) => {
      d.settings = { ...d.settings, ...partial }
    })
    if (localStorage.getItem('fluiser_demo_mode') === 'true') return
    const updateData: Record<string, unknown> = {}
    if (partial.name !== undefined) updateData.fluiser_name = partial.name
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.auth.updateUser({ data: updateData })
      if (error) console.error('writeSettings', error)
    }
  }

  function setFocus(on: boolean) {
    update((d) => { d.focusOn = on })
  }

  function startTimer(habit: Habit) {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null }
    const cfg = habit.timer ?? { enabled: true, duration: 25, sessions: 1, breakDuration: 0 }
    const workSec = (cfg.duration || 25) * 60
    const breakSec = (cfg.breakDuration || 0) * 60
    const sessions = cfg.sessions || 1
    timerState.value = {
      habitId: habit.id, phase: 'work', currentSession: 1,
      remaining: workSec, endAt: Date.now() + workSec * 1000,
      paused: false, workSec, breakSec, sessions, flowExtensions: 0,
      journey: [{ type: 'work', startAt: Date.now() }],
    }
    timerMinimized.value = false
    _timerInterval = setInterval(_tick, 500)
    _saveTimer()
  }

  function stopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null }
    timerState.value = null
    timerMinimized.value = false
    localStorage.removeItem(TIMER_STORAGE_KEY)
  }

  function pauseTimer() {
    const s = timerState.value
    if (!s || s.paused || s.phase === 'review') return
    const now = Date.now()
    const sc = _closeSegment(s)
    timerState.value = {
      ...sc,
      paused: true,
      remaining: s.endAt ? Math.ceil((s.endAt - now) / 1000) : s.remaining,
      endAt: null,
      journey: [...sc.journey, { type: 'pause' as const, startAt: now }],
    }
    _saveTimer()
  }

  function resumeTimer() {
    const s = timerState.value
    if (!s || !s.paused || s.phase === 'review') return
    const now = Date.now()
    const sc = _closeSegment(s)
    const resumeType = _lastActiveSegType(sc.journey)
    timerState.value = {
      ...sc,
      paused: false,
      endAt: now + s.remaining * 1000,
      journey: [...sc.journey, { type: resumeType, startAt: now }],
    }
    if (!_timerInterval) _timerInterval = setInterval(_tick, 500)
    _saveTimer()
  }

  function skipTimerSession() {
    const s = timerState.value
    if (!s || s.phase === 'review') return
    const now = Date.now()
    const sc = _closeSegment(s)
    if (s.phase === 'work') {
      if (s.currentSession >= s.sessions) {
        timerState.value = { ...sc, phase: 'review', remaining: 0, endAt: null }
        if (timerMinimized.value) timerMinimized.value = false
      } else if (s.breakSec > 0) {
        timerState.value = { ...sc, phase: 'break', remaining: s.breakSec, endAt: s.paused ? null : now + s.breakSec * 1000, journey: [...sc.journey, { type: 'break' as const, startAt: now }] }
      } else {
        timerState.value = { ...sc, currentSession: s.currentSession + 1, remaining: s.workSec, endAt: s.paused ? null : now + s.workSec * 1000, journey: [...sc.journey, { type: 'work' as const, startAt: now }] }
      }
    } else if (s.phase === 'break' || s.phase === 'flow-check') {
      timerState.value = { ...sc, phase: 'work', currentSession: s.phase === 'break' ? s.currentSession + 1 : s.currentSession, remaining: s.workSec, endAt: s.paused ? null : now + s.workSec * 1000, journey: [...sc.journey, { type: 'work' as const, startAt: now }] }
    }
    _saveTimer()
  }

  function finishTimerNow() {
    const s = timerState.value
    if (!s) return
    timerState.value = { ..._closeSegment(s), phase: 'review', remaining: 0, endAt: null }
    if (timerMinimized.value) timerMinimized.value = false
    _saveTimer()
  }

  function continueFlow() {
    const s = timerState.value
    if (!s || s.phase !== 'flow-check') return
    const now = Date.now()
    const flowSec = 5 * 60
    timerState.value = {
      ...s,
      phase: 'work',
      remaining: flowSec,
      endAt: now + flowSec * 1000,
      paused: false,
      flowExtensions: (s.flowExtensions ?? 0) + 1,
      journey: [...s.journey, { type: 'flow' as const, startAt: now }],
    }
    _saveTimer()
  }

  function minimizeTimer() { timerMinimized.value = true }
  function expandTimer() { timerMinimized.value = false }

  const dueToday = computed((): Habit[] => {
    const now = new Date(todayRef.value + 'T00:00:00')
    return data.value.habits.filter((h) => isHabitDue(h, now))
  })

  const todayProgress = computed(() => {
    const due = dueToday.value
    const t = todayRef.value
    const done = due.filter((h) => data.value.completions[`${h.id}|${t}`]).length
    return { done, total: due.length, pct: due.length ? done / due.length : 0 }
  })

  function streakOf(habitId: string): StreakInfo {
    const habit = data.value.habits.find((h) => h.id === habitId)
    if (!habit) return { current: 0, best: 0, lastBreak: null }
    const NOW = today()
    let cur = 0, best = 0, run = 0
    let lastBreak: string | null = null
    let firstMiss = false
    for (let i = 0; i < 200; i++) {
      const d = addDays(NOW, -i)
      const dStr = ymd(d)
      if (new Date(dStr) < new Date(habit.createdAt)) break
      if (!isHabitDue(habit, d)) continue
      const done = !!data.value.completions[`${habitId}|${dStr}`]
      if (done) {
        run++
        if (!firstMiss) cur++
        if (run > best) best = run
      } else {
        firstMiss = true
        if (run > 0 && !lastBreak) lastBreak = dStr
        run = 0
      }
    }
    return { current: cur, best, lastBreak }
  }

  async function upsertMeta(m: Meta) {
    update((d) => {
      const idx = d.metas.findIndex((x) => x.id === m.id)
      if (idx >= 0) d.metas[idx] = m
      else d.metas.push(m)
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await db.upsertMeta(user.id, m)
  }

  async function deleteMeta(id: string) {
    update((d) => { d.metas = d.metas.filter((m) => m.id !== id) })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await db.deleteMeta(user.id, id)
  }

  async function upsertVisionItem(item: VisionItem) {
    update((d) => {
      const idx = d.visionItems.findIndex((x) => x.id === item.id)
      if (idx >= 0) d.visionItems[idx] = item
      else d.visionItems.push(item)
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await db.upsertVisionItem(user.id, item)
  }

  async function deleteVisionItem(id: string) {
    update((d) => { d.visionItems = d.visionItems.filter((v) => v.id !== id) })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await db.deleteVisionItem(user.id, id)
  }

  async function saveWeeklyReview(review: WeeklyReview) {
    update((d) => { d.weeklyReviews[review.weekKey] = review })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await db.upsertWeeklyReview(user.id, review)
  }

  function habitLinkedMetas(habitId: string): Meta[] {
    return data.value.metas.filter((m) => m.habitIds.includes(habitId))
  }

  function heatmapData(habitId: string | null = null, days = 120): HeatmapCell[] {
    const NOW = today()
    const start = addDays(NOW, -(days - 1))
    const out: HeatmapCell[] = []
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i)
      const dStr = ymd(d)
      let count = 0, due = 0
      if (habitId) {
        const h = data.value.habits.find((x) => x.id === habitId)
        if (h && isHabitDue(h, d)) {
          due = 1
          if (data.value.completions[`${h.id}|${dStr}`]) count = 1
        }
      } else {
        for (const h of data.value.habits) {
          if (new Date(dStr) < new Date(h.createdAt)) continue
          if (isHabitDue(h, d)) {
            due++
            if (data.value.completions[`${h.id}|${dStr}`]) count++
          }
        }
      }
      const ratio = due ? count / due : 0
      const level = (ratio === 0 ? 0 : ratio < 0.34 ? 1 : ratio < 0.67 ? 2 : ratio < 1 ? 3 : 4) as 0 | 1 | 2 | 3 | 4
      out.push({ date: dStr, level, count, due })
    }
    return out
  }

  return {
    data, activeTimer, timerState, timerMinimized, loading,
    update, isDone, completion,
    toggleHabit, setEnergy, setNote,
    upsertHabit, deleteHabit,
    writeJournal, writeCheckin, writeSettings,
    setFocus, startTimer, stopTimer,
    pauseTimer, resumeTimer, skipTimerSession, finishTimerNow, continueFlow,
    minimizeTimer, expandTimer,
    upsertMeta, deleteMeta,
    upsertVisionItem, deleteVisionItem,
    saveWeeklyReview, habitLinkedMetas,
    dueToday, todayProgress,
    streakOf, heatmapData,
    reset, init,
    utils: { ymd, today, addDays, daysBetween, startOfWeek },
    constants: { CATEGORIES },
  }
})
