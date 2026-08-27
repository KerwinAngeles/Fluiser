<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useToday } from '@/composables/useToday'
import { CATEGORIES } from '@/types'
import { ICON_MAP, PlusIcon } from '@/components/icons/AppIcons'
import type { Habit, CategoryId } from '@/types'

const store = useFluiserStore()
const router = useRouter()
const t = useT()
const { today } = useToday()

const filter = ref<CategoryId | 'all'>('all')
const showInactive = ref(false)

const inactiveCount = computed(() => store.data.habits.filter((h) => h.active === false).length)

const filtered = computed(() =>
  store.data.habits.filter((h) =>
    (showInactive.value ? h.active === false : h.active !== false) &&
    (filter.value === 'all' || h.category === filter.value)
  )
)

function openNew() {
  router.push('/habits/new')
}

function openEdit(h: Habit) {
  router.push(`/habits/${h.id}/edit`)
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
        <div class="screen-sub">{{ t(`${store.activeHabits.length} cultivándose`, `${store.activeHabits.length} growing`) }}</div>
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
      <button
        v-if="inactiveCount > 0"
        class="pill cursor-pointer transition-colors px-3 py-1.5 font-medium ml-auto"
        :class="showInactive ? 'border border-transparent' : 'bg-border-subtle text-text-2 border border-transparent hover:text-text-1'"
        :style="showInactive ? { background: 'var(--rose-soft)', color: 'var(--rose)' } : {}"
        @click="showInactive = !showInactive"
      >{{ t(`Inactivos (${inactiveCount})`, `Inactive (${inactiveCount})`) }}</button>
    </div>

    <!-- Habit cards -->
    <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
      <div
        v-for="s in habitSummaries" :key="s.habit.id"
        class="habit-card"
        :class="{ 'habit-card--inactive': s.habit.active === false }"
        :style="{ '--tone': `var(--${s.habit.tone})`, '--tone-soft': `var(--${s.habit.tone}-soft)` }"
        @click="openEdit(s.habit)"
      >
        <!-- Header row -->
        <div class="hc-header">
          <div class="hc-badge">
            <span class="hc-badge-num tnum">{{ s.streak.current > 0 ? s.streak.current : '—' }}</span>
          </div>
          <div class="hc-info">
            <div class="hc-name-row">
              <div class="hc-name">{{ s.habit.name }}</div>
              <div v-if="s.habit.active === false" class="hc-inactive-chip">{{ t('Inactivo', 'Inactive') }}</div>
            </div>
            <div class="hc-meta">
              {{ t(`${s.streak.current} día${s.streak.current === 1 ? '' : 's'} seguidos`, `${s.streak.current} day${s.streak.current === 1 ? '' : 's'} in a row`) }}
              · {{ s.rate30 }}% {{ t('en 30 d', 'in 30d') }}
            </div>
          </div>
          <div class="hc-cat-icon">
            <component :is="ICON_MAP[s.habit.icon] ?? ICON_MAP.Habits" :size="14" />
          </div>
        </div>

        <!-- 14-day bar track -->
        <div class="hc-track">
          <div v-for="cell in s.cells14" :key="cell.date" class="hc-track-col">
            <div
              class="hc-bar"
              :data-state="cell.due === 0 ? 'off' : cell.count > 0 ? 'done' : 'miss'"
              :data-today="cell.date === today ? 'yes' : 'no'"
            />
          </div>
        </div>

        <!-- Footer: record/total -->
        <div class="hc-footer">
          <div class="hc-footer-stats">
            {{ t('récord', 'best') }} {{ s.streak.best }} · {{ t('total', 'total') }} {{ s.totalDone }}
          </div>
        </div>
      </div>

      <div v-if="habitSummaries.length === 0" key="__empty" class="py-12 text-center italic text-sm text-text-3">
        {{ showInactive
          ? t('No tienes hábitos inactivos.', 'You have no inactive habits.')
          : t('Ningún hábito en esta categoría todavía.', 'No habits in this category yet.') }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ── Card — reference component, retoned to each habit's own tone instead
   of a fixed purple, and fed entirely from data habitSummaries already
   computed (streak, rate30, cells14, totalDone, doneToday). ── */
.habit-card {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 16px 18px;
  cursor: pointer;
  overflow: hidden;
  transition: background 160ms ease, border-color 160ms ease;
}
.habit-card::before {
  content: '';
  position: absolute;
  top: -40%; right: -20%;
  width: 60%; height: 140%;
  background: radial-gradient(circle, var(--tone-soft) 0%, transparent 70%);
  pointer-events: none;
}
.habit-card:hover { background: var(--bg-elevated); }
.habit-card--inactive { opacity: 0.6; }

.hc-inactive-chip {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--rose-soft);
  color: var(--rose);
  flex-shrink: 0;
  white-space: nowrap;
}

/* ── Header ── */
.hc-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.hc-badge {
  width: 42px; height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--tone) 0%, color-mix(in srgb, var(--tone) 55%, black) 100%);
  box-shadow: 0 4px 14px -4px var(--tone);
}
.hc-badge-num { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
.hc-info { flex: 1; min-width: 0; }
.hc-name-row { display: flex; align-items: center; gap: 8px; }
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
.hc-cat-icon {
  width: 26px; height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--tone-soft);
  color: var(--tone);
  opacity: 0.85;
}

/* ── 14-day bar track ── */
.hc-track {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 30px;
  margin-bottom: 14px;
}
.hc-track-col { flex: 1; display: flex; align-items: flex-end; height: 100%; }
.hc-bar {
  width: 100%;
  border-radius: 3px;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.hc-bar[data-state="done"] {
  height: 100%;
  background: var(--tone);
  opacity: 0.82;
}
.hc-bar[data-state="done"][data-today="yes"] {
  opacity: 1;
  box-shadow: 0 0 10px var(--tone);
}
.hc-bar[data-state="miss"] {
  height: 34%;
  background: var(--border-default);
}
.hc-bar[data-state="miss"][data-today="yes"] {
  background: var(--tone-soft);
  box-shadow: inset 0 0 0 1.5px var(--tone);
}
.hc-bar[data-state="off"] {
  height: 14%;
  background: var(--border-subtle);
  opacity: 0.4;
}

/* ── Footer: record/total ── */
.hc-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.hc-footer-stats {
  font-size: 11.5px;
  color: var(--text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
