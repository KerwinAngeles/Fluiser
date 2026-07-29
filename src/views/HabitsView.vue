<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT, useCatLabel } from '@/composables/useLang'
import { useTheme } from '@/composables/useTheme'
import { useToday } from '@/composables/useToday'
import { CATEGORIES } from '@/types'
import { ICON_MAP, PlusIcon, FlameIcon } from '@/components/icons/AppIcons'
import HabitEditorModal from '@/components/modals/HabitEditorModal.vue'
import SessionHistoryModal from '@/components/modals/SessionHistoryModal.vue'
import type { Habit, CategoryId } from '@/types'

const store = useFluiserStore()
const t = useT()
const catLabel = useCatLabel()
const { lang } = useTheme()
const { today } = useToday()

const filter = ref<CategoryId | 'all'>('all')
const editingHabit = ref<Habit | null>(null)
const isNew = ref(false)
const historyHabit = ref<Habit | null>(null)

const filtered = computed(() =>
  store.data.habits.filter((h) => filter.value === 'all' || h.category === filter.value)
)

function openNew() {
  editingHabit.value = {
    id: crypto.randomUUID(), name: '', category: 'mente', icon: 'Brain', tone: 'sky',
    time: '', freq: 'daily',
    timer: { enabled: false, duration: 25, sessions: 1, breakDuration: 5 },
    createdAt: today.value,
  }
  isNew.value = true
}

function openEdit(h: Habit) {
  editingHabit.value = { ...h }
  isNew.value = false
}

const dowLabels = computed(() =>
  lang.value === 'en'
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['D', 'L', 'M', 'X', 'J', 'V', 'S']
)

function dayLetter(dateStr: string): string {
  return dowLabels.value[new Date(dateStr + 'T00:00:00').getDay()]
}

function freqLabel(freq: string): string {
  if (freq === 'daily') return t('diario', 'daily')
  if (freq === 'mon,tue,wed,thu,fri') return t('L–V', 'M–F')
  if (freq === 'mon,wed,fri') return t('L·M·V', 'M·W·F')
  if (freq === 'sat,sun') return t('fin de semana', 'weekends')
  const n = freq.split(',').length
  return t(`${n}×/sem`, `${n}×/wk`)
}

const habitSummaries = computed(() =>
  filtered.value.map(h => {
    const streak = store.streakOf(h.id)
    const cells14 = store.heatmapData(h.id, 14)
    const d30 = store.heatmapData(h.id, 30)
    const active30 = d30.filter(c => c.due > 0)
    const rate30 = active30.length
      ? Math.round(active30.filter(c => c.count > 0).length / active30.length * 100)
      : 0
    const totalDone = Object.keys(store.data.completions)
      .filter(k => k.startsWith(h.id + '|')).length
    return { habit: h, streak, cells14, rate30, totalDone, doneToday: store.isDone(h.id, today.value) }
  })
)
</script>

<template>
  <div class="screen">
    <div class="screen-head">
      <div>
        <div class="screen-eyebrow">{{ t('Tu jardín', 'Your garden') }}</div>
        <h1 class="screen-title">{{ t('Hábitos', 'Habits') }}</h1>
        <div class="screen-sub">{{ t(`${store.data.habits.length} cultivándose`, `${store.data.habits.length} growing`) }}</div>
      </div>
      <button class="btn btn-primary" @click="openNew">
        <PlusIcon :size="13" /> {{ t('Nuevo hábito', 'New habit') }}
      </button>
    </div>

    <!-- Category filter pills -->
    <div class="flex gap-1.5 flex-wrap mb-6">
      <button
        class="pill cursor-pointer transition-colors px-3 py-1.5 font-medium"
        :class="filter === 'all' ? 'bg-bg-elevated text-text-1 border border-border-default' : 'bg-border-subtle text-text-2 border border-transparent hover:text-text-1'"
        @click="filter = 'all'"
      >{{ t('Todo', 'All') }}</button>
      <button
        v-for="c in CATEGORIES" :key="c.id"
        class="pill cursor-pointer transition-colors px-3 py-1.5 font-medium"
        :class="filter === c.id ? 'border border-transparent' : 'bg-border-subtle text-text-2 border border-transparent hover:text-text-1'"
        :style="filter === c.id ? { background: `var(--${c.tone}-soft)`, color: `var(--${c.tone})` } : {}"
        @click="filter = c.id"
      >{{ c.label }}</button>
    </div>

    <!-- Habit cards -->
    <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
      <div
        v-for="s in habitSummaries" :key="s.habit.id"
        class="habit-card"
        :style="{ '--tone': `var(--${s.habit.tone})`, '--tone-soft': `var(--${s.habit.tone}-soft)` }"
        @click="openEdit(s.habit)"
      >
        <!-- Header row -->
        <div class="hc-header">
          <div class="hc-icon">
            <component :is="ICON_MAP[s.habit.icon] ?? ICON_MAP.Habits" :size="17" />
          </div>
          <div class="hc-info">
            <div class="hc-name">{{ s.habit.name }}</div>
            <div class="hc-meta">
              {{ catLabel(s.habit.category).label }}
              <template v-if="s.habit.time"> · <span class="tnum">{{ s.habit.time }}</span></template>
              · {{ freqLabel(s.habit.freq) }}
              <template v-if="s.habit.timer?.enabled"> · {{ s.habit.timer.sessions }}×{{ s.habit.timer.duration }}min</template>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <div v-if="s.doneToday" class="hc-done-chip">✓ {{ t('Hecho', 'Done') }}</div>
            <button
              v-if="s.habit.timer?.enabled"
              class="hc-history-btn"
              @click.stop="historyHabit = s.habit"
              :title="t('Ver sesiones', 'View sessions')"
            >⏱</button>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="hc-stats">
          <div class="hc-stat">
            <div class="hc-stat-val" style="color: var(--amber)">
              <FlameIcon :size="11" />{{ s.streak.current > 0 ? s.streak.current : '—' }}
            </div>
            <div class="hc-stat-lbl">{{ t('racha', 'streak') }}</div>
          </div>
          <div class="hc-stat-sep" />
          <div class="hc-stat">
            <div
              class="hc-stat-val"
              :style="{ color: s.streak.current >= s.streak.best && s.streak.best > 0 ? 'var(--tone)' : 'var(--text-2)' }"
            >↑ {{ s.streak.best }}</div>
            <div class="hc-stat-lbl">{{ t('récord', 'best') }}</div>
          </div>
          <div class="hc-stat-sep" />
          <div class="hc-stat">
            <div class="hc-stat-val" style="color: var(--tone)">{{ s.rate30 }}%</div>
            <div class="hc-stat-lbl">{{ t('últimos 30d', 'last 30d') }}</div>
          </div>
          <div class="hc-stat-sep" />
          <div class="hc-stat">
            <div class="hc-stat-val" style="color: var(--lilac)">{{ s.totalDone }}</div>
            <div class="hc-stat-lbl">{{ t('total', 'total') }}</div>
          </div>
        </div>

        <!-- Rate bar -->
        <div class="hc-rate-track">
          <div class="hc-rate-fill" :style="{ width: s.rate30 + '%' }" />
        </div>

        <!-- 14-day track -->
        <div class="hc-track">
          <div v-for="cell in s.cells14" :key="cell.date" class="hc-track-col">
            <div
              class="hc-dot"
              :data-state="cell.due === 0 ? 'off' : cell.count > 0 ? 'done' : 'miss'"
              :data-today="cell.date === today ? 'yes' : 'no'"
            />
            <span class="hc-day-lbl">{{ dayLetter(cell.date) }}</span>
          </div>
        </div>
      </div>

      <div v-if="habitSummaries.length === 0" key="__empty" class="py-12 text-center italic text-sm text-text-3">
        {{ t('Ningún hábito en esta categoría todavía.', 'No habits in this category yet.') }}
      </div>
    </TransitionGroup>

    <HabitEditorModal :habit="editingHabit" :isNew="isNew" @close="editingHabit = null" />
    <SessionHistoryModal v-if="historyHabit" :habit="historyHabit" @close="historyHabit = null" />
  </div>
</template>

<style scoped>
/* ── Card ── */
.habit-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--tone);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}
.habit-card:hover { background: var(--bg-elevated); }

/* ── Header ── */
.hc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.hc-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--tone-soft);
  color: var(--tone);
}
.hc-info { flex: 1; min-width: 0; }
.hc-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1.2;
}
.hc-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 3px;
}
.hc-done-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--mint-soft);
  color: var(--mint);
  flex-shrink: 0;
  white-space: nowrap;
}
.hc-history-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 999px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-3); font-size: 11px; cursor: pointer;
  transition: all 180ms; white-space: nowrap;
}
.hc-history-btn:hover { border-color: var(--border-default); color: var(--text-2); }

/* ── Stats strip ── */
.hc-stats {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}
.hc-stat {
  flex: 1;
  text-align: center;
  padding: 9px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.hc-stat-val {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 3px;
  font-variant-numeric: tabular-nums;
}
.hc-stat-lbl {
  font-size: 10px;
  color: var(--text-3);
  white-space: nowrap;
}
.hc-stat-sep {
  width: 1px;
  height: 28px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

/* ── Rate bar ── */
.hc-rate-track {
  height: 3px;
  background: var(--border-subtle);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 12px;
}
.hc-rate-fill {
  height: 100%;
  background: var(--tone);
  border-radius: 99px;
  transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── 14-day track ── */
.hc-track {
  display: flex;
  justify-content: space-between;
}
.hc-track-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.hc-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.hc-dot[data-state="done"] {
  background: var(--tone);
  opacity: 0.82;
}
.hc-dot[data-state="done"][data-today="yes"] {
  opacity: 1;
  transform: scale(1.25);
  box-shadow: 0 0 8px var(--tone);
}
.hc-dot[data-state="miss"] {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--border-default);
  opacity: 0.5;
}
.hc-dot[data-state="miss"][data-today="yes"] {
  box-shadow: inset 0 0 0 1.5px var(--tone);
  opacity: 0.85;
}
.hc-dot[data-state="off"] {
  background: var(--border-subtle);
  opacity: 0.2;
}
.hc-day-lbl {
  font-size: 9px;
  color: var(--text-4);
  line-height: 1;
}
</style>
