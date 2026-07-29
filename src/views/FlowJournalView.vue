<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useFlowJournal } from '@/composables/useFlowJournal'
import { useT } from '@/composables/useLang'
import { ICON_MAP } from '@/components/icons/AppIcons'
import { ENERGY } from '@/types'
import SessionJourney from '@/components/ui/SessionJourney.vue'

const store = useFluiserStore()
const t = useT()
const { loading, activeFilter, byDate, habitStats, weekStats, load } = useFlowJournal()

onMounted(() => load())

const timerHabits = computed(() =>
  store.data.habits.filter((h) => h.timer?.enabled)
)

function fmtHM(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

function fmtDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (today.getTime() - target.getTime()) / 86400000
  if (diff === 0) return t('Hoy', 'Today')
  if (diff === 1) return t('Ayer', 'Yesterday')
  if (diff < 7) return d.toLocaleDateString('es', { weekday: 'long' })
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function energyInfo(id: string) {
  return ENERGY.find((e) => e.id === id)
}

function habitById(id: string) {
  return store.data.habits.find((h) => h.id === id)
}

const totalEverSec = computed(() =>
  store.data.habits.reduce((sum, h) => {
    const s = habitStats.value.get(h.id)
    return sum + (s?.totalSec ?? 0)
  }, 0)
)

const CIRC_R = 22
const CIRC_LEN = 2 * Math.PI * CIRC_R

function weekRingOffset(habitId: string, targetSec: number) {
  const s = habitStats.value.get(habitId)
  if (!s || targetSec === 0) return CIRC_LEN
  const pct = Math.min(s.weekSec / targetSec, 1)
  return CIRC_LEN * (1 - pct)
}
</script>

<template>
  <div class="fj-screen screen">

    <!-- ── PAGE HEADER ── -->
    <div class="fj-head">
      <div>
        <div class="screen-eyebrow">{{ t('Tu diario de enfoque', 'Your focus diary') }}</div>
        <h1 class="screen-title">{{ t('Flujo', 'Flow') }}</h1>
      </div>
      <div v-if="totalEverSec > 0" class="fj-total-badge">
        {{ fmtHM(totalEverSec) }} {{ t('en total', 'total') }}
      </div>
    </div>

    <!-- ── WEEKLY STATS ── -->
    <div class="fj-stats-row">
      <div class="fj-stat-card fj-stat-focus">
        <div class="fj-stat-icon">⏱</div>
        <div class="fj-stat-val">{{ weekStats.weekSec > 0 ? fmtHM(weekStats.weekSec) : '—' }}</div>
        <div class="fj-stat-label">{{ t('esta semana', 'this week') }}</div>
        <div v-if="weekStats.trend !== null" class="fj-stat-trend" :class="weekStats.trend >= 0 ? 'up' : 'down'">
          {{ weekStats.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(weekStats.trend) }}% vs semana pasada
        </div>
      </div>

      <div class="fj-stat-card fj-stat-sessions">
        <div class="fj-stat-icon">🎯</div>
        <div class="fj-stat-val">{{ weekStats.weekCount }}</div>
        <div class="fj-stat-label">{{ t('sesiones', 'sessions') }}</div>
      </div>

      <div class="fj-stat-card fj-stat-flow">
        <div class="fj-stat-icon">🌊</div>
        <div class="fj-stat-val">{{ weekStats.flowSec > 0 ? fmtHM(weekStats.flowSec) : '—' }}</div>
        <div class="fj-stat-label">{{ t('en flujo', 'in flow') }}</div>
      </div>
    </div>

    <!-- ── HABIT ORBIT STRIP ── -->
    <div v-if="timerHabits.length > 0" class="fj-habits-section">
      <div class="fj-habits-label">{{ t('Filtrar por hábito', 'Filter by habit') }}</div>
      <div class="fj-habits-strip">
        <!-- All button -->
        <button
          class="fj-habit-orb"
          :class="{ active: activeFilter === null }"
          @click="activeFilter = null"
        >
          <div class="fj-orb-ring-wrap">
            <svg :width="(CIRC_R+8)*2" :height="(CIRC_R+8)*2" style="transform:rotate(-90deg)">
              <circle :cx="CIRC_R+8" :cy="CIRC_R+8" :r="CIRC_R" stroke-width="2.5" fill="none" stroke="var(--border-subtle)" />
              <circle :cx="CIRC_R+8" :cy="CIRC_R+8" :r="CIRC_R" stroke-width="2.5" fill="none"
                stroke="var(--text-3)" stroke-linecap="round"
                :stroke-dasharray="CIRC_LEN" :stroke-dashoffset="0" />
            </svg>
            <div class="fj-orb-inner" style="background:var(--bg-elevated);color:var(--text-2)">
              <span style="font-size:14px">✦</span>
            </div>
          </div>
          <span class="fj-orb-label">{{ t('Todo', 'All') }}</span>
        </button>

        <!-- Per-habit orbs -->
        <button
          v-for="h in timerHabits" :key="h.id"
          class="fj-habit-orb"
          :class="{ active: activeFilter === h.id }"
          @click="activeFilter = activeFilter === h.id ? null : h.id"
        >
          <div class="fj-orb-ring-wrap">
            <svg :width="(CIRC_R+8)*2" :height="(CIRC_R+8)*2" style="transform:rotate(-90deg)">
              <circle :cx="CIRC_R+8" :cy="CIRC_R+8" :r="CIRC_R" stroke-width="2.5" fill="none" stroke="var(--border-subtle)" />
              <circle :cx="CIRC_R+8" :cy="CIRC_R+8" :r="CIRC_R" stroke-width="2.5" fill="none"
                :stroke="`var(--${h.tone})`" stroke-linecap="round"
                :stroke-dasharray="CIRC_LEN"
                :stroke-dashoffset="weekRingOffset(h.id, h.timer.sessions * h.timer.duration * 60 * 5)"
                style="transition:stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)"
              />
            </svg>
            <div class="fj-orb-inner" :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }">
              <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="14" />
            </div>
          </div>
          <span class="fj-orb-label">{{ h.name.split(' ')[0] }}</span>
          <span v-if="habitStats.get(h.id)?.weekSec" class="fj-orb-time">
            {{ fmtHM(habitStats.get(h.id)!.weekSec) }}
          </span>
        </button>
      </div>
    </div>

    <!-- ── SESSION FEED ── -->
    <div class="fj-feed">

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="fj-skeleton-group">
          <div class="fj-skeleton-date" />
          <div class="fj-skeleton-card" />
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="byDate.length === 0" class="fj-empty">
        <div class="fj-empty-icon">⏳</div>
        <div class="fj-empty-title">{{ t('Sin sesiones todavía', 'No sessions yet') }}</div>
        <div class="fj-empty-sub">
          {{ t('Completa una sesión de timer para ver tu historial aquí.', 'Complete a timer session to see your history here.') }}
        </div>
      </div>

      <!-- Date groups -->
      <template v-else>
        <div v-for="group in byDate" :key="group.date" class="fj-date-group">
          <div class="fj-date-header">
            <span class="fj-date-label">{{ fmtDateLabel(group.date) }}</span>
            <span class="fj-date-full">{{ new Date(group.date + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long' }) }}</span>
            <span class="fj-date-count">{{ group.sessions.length }} {{ group.sessions.length === 1 ? t('sesión', 'session') : t('sesiones', 'sessions') }}</span>
          </div>

          <div class="fj-cards">
            <div
              v-for="(s, i) in group.sessions" :key="i"
              class="fj-card"
              :style="{ '--hue': `var(--${habitById(s.habitId)?.tone ?? 'sky'})`, '--hue-soft': `var(--${habitById(s.habitId)?.tone ?? 'sky'}-soft)` }"
            >
              <!-- Left accent bar -->
              <div class="fj-card-bar" />

              <div class="fj-card-body">
                <!-- Top row: habit chip + duration + energy -->
                <div class="fj-card-top">
                  <div class="fj-habit-chip">
                    <div class="fj-habit-chip-icon">
                      <component :is="ICON_MAP[habitById(s.habitId)?.icon ?? 'Habits'] ?? ICON_MAP.Habits" :size="11" />
                    </div>
                    <span>{{ habitById(s.habitId)?.name ?? s.habitId }}</span>
                  </div>

                  <div class="fj-card-right-chips">
                    <span
                      v-if="energyInfo(s.energy)"
                      class="fj-energy-pill"
                      :style="{ background: `var(--${energyInfo(s.energy)!.tone}-soft)`, color: `var(--${energyInfo(s.energy)!.tone})` }"
                    >{{ energyInfo(s.energy)!.label }}</span>

                    <span class="fj-dur-pill">{{ fmtHM(s.actualSec) }}</span>
                  </div>
                </div>

                <!-- Journey bar -->
                <div v-if="s.journey.length > 1" class="fj-card-journey">
                  <SessionJourney :segments="s.journey" :tone="habitById(s.habitId)?.tone ?? 'sky'" />
                </div>

                <!-- Note + flow badge -->
                <div v-if="s.note || s.flowExtensions > 0" class="fj-card-footer">
                  <span v-if="s.flowExtensions > 0" class="fj-flow-tag">🌊 +{{ s.flowExtensions * 5 }} min en flujo</span>
                  <span v-if="s.note" class="fj-note">"{{ s.note }}"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fj-screen { padding-bottom: 60px; }

/* ── Header ── */
.fj-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
}
.fj-total-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
}

/* ── Stats row ── */
.fj-stats-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
}
.fj-stat-card {
  border-radius: 16px;
  padding: 18px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
}
.fj-stat-focus {
  background: linear-gradient(135deg, var(--sky-soft) 0%, var(--bg-surface) 100%);
}
.fj-stat-sessions {
  background: linear-gradient(135deg, var(--mint-soft) 0%, var(--bg-surface) 100%);
}
.fj-stat-flow {
  background: linear-gradient(135deg, var(--amber-soft) 0%, var(--bg-surface) 100%);
}
.fj-stat-icon { font-size: 16px; margin-bottom: 4px; }
.fj-stat-val {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.fj-stat-label { font-size: 11.5px; color: var(--text-3); }
.fj-stat-trend {
  font-size: 10.5px;
  font-weight: 500;
  margin-top: 4px;
}
.fj-stat-trend.up { color: var(--mint); }
.fj-stat-trend.down { color: var(--rose); }

@media (max-width: 520px) {
  .fj-stats-row { grid-template-columns: 1fr 1fr; }
  .fj-stat-focus { grid-column: 1 / -1; }
}

/* ── Habit orbit strip ── */
.fj-habits-section { margin-bottom: 28px; }
.fj-habits-label {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--text-3);
  margin-bottom: 12px;
}
.fj-habits-strip {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none;
}
.fj-habits-strip::-webkit-scrollbar { display: none; }

.fj-habit-orb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: transform 180ms;
  opacity: 0.65;
}
.fj-habit-orb:hover { opacity: 1; transform: translateY(-2px); }
.fj-habit-orb.active { opacity: 1; }

.fj-orb-ring-wrap {
  position: relative;
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
}
.fj-orb-inner {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  transition: transform 200ms;
}
.fj-habit-orb.active .fj-orb-inner {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 3.5px currentColor;
}
.fj-orb-label {
  font-size: 11px;
  color: var(--text-2);
  font-weight: 500;
  max-width: 64px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fj-orb-time {
  font-size: 10px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

/* ── Feed ── */
.fj-feed { display: flex; flex-direction: column; gap: 32px; }

.fj-date-group { display: flex; flex-direction: column; gap: 10px; }
.fj-date-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.fj-date-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.02em;
}
.fj-date-full {
  font-size: 12px;
  color: var(--text-3);
}
.fj-date-count {
  font-size: 11px;
  color: var(--text-3);
  margin-left: auto;
}

.fj-cards { display: flex; flex-direction: column; gap: 8px; }

/* ── Session card ── */
.fj-card {
  display: flex;
  border-radius: 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: background 160ms, border-color 160ms, transform 160ms;
}
.fj-card:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  transform: translateX(3px);
}

.fj-card-bar {
  width: 3px;
  flex-shrink: 0;
  background: var(--hue);
  opacity: 0.85;
}

.fj-card-body {
  flex: 1;
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.fj-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fj-habit-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  min-width: 0;
}
.fj-habit-chip-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--hue-soft);
  color: var(--hue);
}

.fj-card-right-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.fj-energy-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
}
.fj-dur-pill {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
}

.fj-card-journey { /* inherits SessionJourney */ }

.fj-card-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.fj-flow-tag {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--amber);
  background: var(--amber-soft);
  padding: 2px 8px;
  border-radius: 999px;
}
.fj-note {
  font-size: 12px;
  color: var(--text-3);
  font-style: italic;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Loading skeleton ── */
.fj-skeleton-group { display: flex; flex-direction: column; gap: 10px; }
.fj-skeleton-date {
  height: 18px;
  width: 120px;
  border-radius: 6px;
  background: var(--border-subtle);
  animation: fj-pulse 1.4s ease infinite;
}
.fj-skeleton-card {
  height: 80px;
  border-radius: 14px;
  background: var(--border-subtle);
  animation: fj-pulse 1.4s ease infinite;
  animation-delay: 0.15s;
}
@keyframes fj-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ── Empty state ── */
.fj-empty {
  text-align: center;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.fj-empty-icon { font-size: 40px; }
.fj-empty-title { font-size: 18px; font-weight: 600; color: var(--text-1); letter-spacing: -0.02em; }
.fj-empty-sub { font-size: 14px; color: var(--text-3); max-width: 300px; line-height: 1.6; }
</style>
