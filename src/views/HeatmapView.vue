<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useTheme } from '@/composables/useTheme'
import { ICON_MAP } from '@/components/icons/AppIcons'
import HeatmapGrid from '@/components/ui/HeatmapGrid.vue'

const store = useFluiserStore()
const t = useT()
const { lang } = useTheme()

const tab = ref<'global' | 'habit'>('global')
const selectedHabitId = ref<string>(store.data.habits[0]?.id ?? '')
const selectedHabit = computed(() => store.data.habits.find((h) => h.id === selectedHabitId.value))

const WEEKS = 17

const dayStats = computed(() => {
  const data = store.heatmapData(null, 90)
  const byDow: Record<number, { total: number; done: number }> = {}
  for (let i = 0; i < 7; i++) byDow[i] = { total: 0, done: 0 }
  for (const cell of data) {
    if (cell.due === 0) continue
    const dow = new Date(cell.date + 'T00:00:00').getDay()
    byDow[dow].total++
    if (cell.count > 0) byDow[dow].done++
  }
  const days_es = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const days_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayLabels = lang.value === 'en' ? days_en : days_es
  return Object.entries(byDow).map(([dow, stats]) => ({
    dow: Number(dow), label: dayLabels[Number(dow)],
    pct: stats.total ? stats.done / stats.total : 0,
  }))
})

const bestDay = computed(() => [...dayStats.value].sort((a, b) => b.pct - a.pct)[0])
const worstDay = computed(() => [...dayStats.value].filter((d) => d.pct > 0).sort((a, b) => a.pct - b.pct)[0])

const globalStats = computed(() => {
  const data = store.heatmapData(null, WEEKS * 7)
  const active = data.filter(c => c.due > 0)
  const completed = active.filter(c => c.count > 0)
  const totalDone = active.reduce((s, c) => s + c.count, 0)
  const totalDue = active.reduce((s, c) => s + c.due, 0)
  const bestStreak = Math.max(0, ...store.data.habits.map(h => store.streakOf(h.id).best))
  return {
    completedDays: completed.length,
    totalDone,
    rate: totalDue ? Math.round(totalDone / totalDue * 100) : 0,
    bestStreak,
  }
})

const habitStats = computed(() => {
  if (!selectedHabit.value) return null
  const data = store.heatmapData(selectedHabitId.value, WEEKS * 7)
  const active = data.filter(c => c.due > 0)
  const done = active.filter(c => c.count > 0)
  const streak = store.streakOf(selectedHabitId.value)
  return {
    doneDays: done.length,
    totalDays: active.length,
    rate: active.length ? Math.round(done.length / active.length * 100) : 0,
    streak: streak.current,
    best: streak.best,
  }
})
</script>

<template>
  <div class="screen">
    <div class="screen-head">
      <div>
        <div class="screen-eyebrow">{{ t('Tu patrón', 'Your pattern') }}</div>
        <h1 class="screen-title">{{ t('Consistencia', 'Consistency') }}</h1>
        <div class="screen-sub">{{ t('Ver dónde vives el hábito.', 'See where you live the habit.') }}</div>
      </div>
    </div>

    <div class="tabs mb-7">
      <button :class="['tab', tab === 'global' ? 'active' : '']" @click="tab = 'global'">{{ t('Global', 'Global') }}</button>
      <button :class="['tab', tab === 'habit' ? 'active' : '']" @click="tab = 'habit'">{{ t('Por hábito', 'By habit') }}</button>
    </div>

    <!-- Global -->
    <template v-if="tab === 'global'">
      <div class="hm-layout">
        <!-- Left: calendar -->
        <div class="hm-cal card p-5">
          <HeatmapGrid :weeks="WEEKS" :show-labels="true" :title="t('Últimas 17 semanas', 'Last 17 weeks')" />
        </div>

        <!-- Right: stats -->
        <div class="hm-aside">
          <div class="stat-strip">
            <div class="stat-chip">
              <div class="stat-val tnum" style="color:var(--accent)">{{ globalStats.completedDays }}</div>
              <div class="stat-lbl">{{ t('días cumplidos', 'days kept') }}</div>
            </div>
            <div class="stat-divider" />
            <div class="stat-chip">
              <div class="stat-val tnum" style="color:var(--mint)">{{ globalStats.rate }}%</div>
              <div class="stat-lbl">{{ t('tasa global', 'overall rate') }}</div>
            </div>
            <div class="stat-divider" />
            <div class="stat-chip">
              <div class="stat-val tnum" style="color:var(--lilac)">{{ globalStats.totalDone }}</div>
              <div class="stat-lbl">{{ t('completados', 'completions') }}</div>
            </div>
            <div class="stat-divider" />
            <div class="stat-chip">
              <div class="stat-val tnum" style="color:var(--amber)">{{ globalStats.bestStreak }}</div>
              <div class="stat-lbl">{{ t('racha récord', 'best streak') }}</div>
            </div>
          </div>

          <div class="rate-track">
            <div class="rate-fill" :style="{ width: globalStats.rate + '%' }" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="card p-4">
              <div class="card-title">{{ t('Mejor día', 'Best day') }}</div>
              <div v-if="bestDay" class="mt-3">
                <div class="text-[20px] font-semibold text-mint">{{ bestDay.label }}</div>
                <div class="text-[12px] text-text-2 mt-1">{{ Math.round(bestDay.pct * 100) }}% {{ t('completado', 'completion') }}</div>
              </div>
            </div>
            <div class="card p-4">
              <div class="card-title">{{ t('Día más difícil', 'Hardest day') }}</div>
              <div v-if="worstDay" class="mt-3">
                <div class="text-[20px] font-semibold text-amber">{{ worstDay.label }}</div>
                <div class="text-[12px] text-text-2 mt-1">{{ Math.round(worstDay.pct * 100) }}% {{ t('completado', 'completion') }}</div>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <div class="card-title mb-4">{{ t('Consistencia por día', 'Consistency by day') }}</div>
            <div class="flex items-end gap-2 h-20">
              <div v-for="d in dayStats" :key="d.dow" class="flex-1 flex flex-col items-center gap-1.5">
                <div class="flex-1 w-full flex items-end">
                  <div
                    class="w-full rounded-[4px] transition-all duration-500"
                    :style="{
                      height: `${Math.max(4, d.pct * 60)}px`,
                      background: d.pct >= 0.7 ? 'var(--mint)' : d.pct >= 0.4 ? 'var(--accent)' : 'var(--border-default)',
                    }"
                  />
                </div>
                <span class="text-[10px] text-text-3">{{ d.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Per-habit -->
    <template v-else>
      <div class="flex gap-2 flex-wrap mb-5">
        <button
          v-for="h in store.data.habits" :key="h.id"
          class="pill cursor-pointer px-3 py-1.5 font-medium border transition-colors"
          :style="selectedHabitId === h.id
            ? { background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})`, borderColor: 'transparent' }
            : { borderColor: 'var(--border-subtle)' }"
          @click="selectedHabitId = h.id"
        >
          <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="11" />
          {{ h.name }}
        </button>
      </div>

      <div v-if="selectedHabit && habitStats" class="hm-layout">
        <!-- Left: calendar -->
        <div class="hm-cal card p-5">
          <HeatmapGrid :habitId="selectedHabitId" :weeks="WEEKS" :show-labels="true" />
        </div>

        <!-- Right: stats -->
        <div class="hm-aside">
          <div class="card p-5">
            <div class="flex items-center gap-3 mb-5">
              <div
                class="w-9 h-9 rounded-[10px] grid place-items-center"
                :style="{ background: `var(--${selectedHabit.tone}-soft)`, color: `var(--${selectedHabit.tone})` }"
              >
                <component :is="ICON_MAP[selectedHabit.icon] ?? ICON_MAP.Habits" :size="16" />
              </div>
              <div class="text-[16px] font-semibold text-text-1">{{ selectedHabit.name }}</div>
            </div>

            <div class="stat-strip mb-4">
              <div class="stat-chip">
                <div class="stat-val tnum" :style="{ color: `var(--${selectedHabit.tone})` }">{{ habitStats.streak }}</div>
                <div class="stat-lbl">{{ t('racha actual', 'streak') }}</div>
              </div>
              <div class="stat-divider" />
              <div class="stat-chip">
                <div class="stat-val tnum" style="color:var(--amber)">{{ habitStats.best }}</div>
                <div class="stat-lbl">{{ t('récord', 'best') }}</div>
              </div>
              <div class="stat-divider" />
              <div class="stat-chip">
                <div class="stat-val tnum" style="color:var(--mint)">{{ habitStats.doneDays }}</div>
                <div class="stat-lbl">{{ t('días cumplidos', 'days done') }}</div>
              </div>
              <div class="stat-divider" />
              <div class="stat-chip">
                <div class="stat-val tnum" style="color:var(--accent)">{{ habitStats.rate }}%</div>
                <div class="stat-lbl">{{ t('completado', 'completion') }}</div>
              </div>
            </div>

            <div class="rate-track">
              <div class="rate-fill" :style="{ width: habitStats.rate + '%', background: `var(--${selectedHabit.tone})` }" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hm-layout {
  display: flex;
  gap: 20px;
  align-items: start;
}
.hm-cal {
  flex: 0 0 420px;
}
.hm-aside {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-strip {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
}
.stat-chip {
  flex: 1;
  text-align: center;
  padding: 14px 8px;
}
.stat-val {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
.stat-lbl {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 6px;
  white-space: nowrap;
}
.stat-divider {
  width: 1px;
  height: 36px;
  background: var(--border-subtle);
  flex-shrink: 0;
}
.rate-track {
  height: 4px;
  background: var(--border-subtle);
  border-radius: 99px;
  overflow: hidden;
}
.rate-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
