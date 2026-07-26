<script setup lang="ts">
import { computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useTheme } from '@/composables/useTheme'
import { getWeeklyInsight } from '@/composables/useStaticAI'
import { ICON_MAP, SparkleIcon, FlameIcon } from '@/components/icons/AppIcons'

const store = useFluiserStore()
const t = useT()
const { lang } = useTheme()

const weeklyData = computed(() => {
  const weeks: { label: string; pct: number }[] = []
  const NOW = new Date()
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(NOW)
    weekStart.setDate(NOW.getDate() - 7 * w - NOW.getDay())
    let done = 0, total = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + d)
      if (date > NOW) break
      const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      for (const h of store.data.habits) {
        const dow = date.getDay()
        const map: Record<number,string> = {0:'sun',1:'mon',2:'tue',3:'wed',4:'thu',5:'fri',6:'sat'}
        if (new Date(ds) < new Date(h.createdAt)) continue
        const isDue = h.freq === 'daily' || h.freq.split(',').map((s: string) => s.trim()).includes(map[dow])
        if (isDue) { total++; if (store.data.completions[`${h.id}|${ds}`]) done++ }
      }
    }
    weeks.push({ label: `S${12 - w}`, pct: total ? done / total : 0 })
  }
  return weeks
})

const habitStats = computed(() =>
  store.data.habits.map((h) => {
    const s = store.streakOf(h.id)
    const cells = store.heatmapData(h.id, 30)
    const due30 = cells.filter((c) => c.due > 0).length
    const done30 = cells.filter((c) => c.count > 0).length
    return { h, s, pct30: due30 ? done30 / due30 : 0 }
  }).sort((a, b) => b.pct30 - a.pct30)
)

const bestHabit = computed(() => habitStats.value[0])
const weeklyPct = computed(() => {
  const last4 = weeklyData.value.slice(-4)
  return last4.reduce((acc, w) => acc + w.pct, 0) / last4.length
})

const insight = computed(() => getWeeklyInsight({
  bestHabitName: bestHabit.value?.h.name ?? 'tu hábito',
  bestStreak: bestHabit.value?.s.current ?? 0,
  weeklyPct: weeklyPct.value,
  lang: lang.value,
}))

const maxPct = computed(() => Math.max(...weeklyData.value.map((w) => w.pct), 0.01))
</script>

<template>
  <div class="screen">
    <div class="screen-head">
      <div>
        <div class="screen-eyebrow">{{ t('Tu historia', 'Your story') }}</div>
        <h1 class="screen-title">Analytics</h1>
      </div>
    </div>

    <!-- Weekly insight -->
    <div class="card mb-6 p-6">
      <div class="flex items-center gap-2.5 mb-3">
        <SparkleIcon :size="15" class="text-accent" />
        <div class="card-title mb-0">{{ t('Insight semanal', 'Weekly insight') }}</div>
      </div>
      <p class="serif text-[15px] leading-relaxed text-text-1 m-0 italic">{{ insight }}</p>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-3 gap-3.5 mb-6">
      <div class="card text-center p-5">
        <div class="card-title">{{ t('Más consistente', 'Most consistent') }}</div>
        <div class="mt-3">
          <div v-if="bestHabit"
            class="w-9 h-9 rounded-[10px] grid place-items-center mx-auto mb-2"
            :style="{ background: `var(--${bestHabit.h.tone}-soft)`, color: `var(--${bestHabit.h.tone})` }"
          >
            <component :is="ICON_MAP[bestHabit.h.icon] ?? ICON_MAP.Habits" :size="16" />
          </div>
          <div class="text-[13px] font-medium text-text-1">{{ bestHabit?.h.name ?? '—' }}</div>
          <div class="text-text-3 text-[11px] mt-1">{{ bestHabit ? `${Math.round(bestHabit.pct30 * 100)}% 30d` : '' }}</div>
        </div>
      </div>

      <div class="card text-center p-5">
        <div class="card-title">{{ t('Racha activa', 'Active streak') }}</div>
        <div class="mt-3">
          <div class="flex items-center justify-center gap-1.5">
            <FlameIcon :size="20" class="text-amber" />
            <span class="tnum text-[34px] font-bold tracking-tight text-amber">{{ bestHabit?.s.current ?? 0 }}</span>
          </div>
          <div class="text-text-3 text-[11px] mt-1">{{ t('días consecutivos', 'consecutive days') }}</div>
        </div>
      </div>

      <div class="card text-center p-5">
        <div class="card-title">{{ t('Promedio semanal', 'Weekly average') }}</div>
        <div class="mt-3">
          <div class="tnum text-[34px] font-bold tracking-tight text-accent">{{ Math.round(weeklyPct * 100) }}%</div>
          <div class="text-text-3 text-[11px] mt-1">{{ t('últimas 4 semanas', 'last 4 weeks') }}</div>
        </div>
      </div>
    </div>

    <!-- 12-week bar chart -->
    <div class="card mb-6 p-6">
      <div class="card-title mb-5">{{ t('Últimas 12 semanas', 'Last 12 weeks') }}</div>
      <div class="flex items-end gap-1.5 h-24">
        <div v-for="(w, i) in weeklyData" :key="i" class="flex-1 flex flex-col items-center gap-1.5">
          <div class="flex-1 w-full flex items-end">
            <div
              :title="`${Math.round(w.pct * 100)}%`"
              class="w-full rounded-[4px_4px_2px_2px] transition-all duration-500"
              :style="{
                height: `${Math.max(4, (w.pct / maxPct) * 80)}px`,
                background: w.pct >= 0.75 ? 'var(--mint)' : w.pct >= 0.4 ? 'var(--accent)' : 'var(--border-default)',
              }"
            />
          </div>
          <span class="text-[9px] text-text-3">{{ w.label }}</span>
        </div>
      </div>
    </div>

    <!-- Per-habit table -->
    <div class="card">
      <div class="card-title mb-4">{{ t('Por hábito', 'By habit') }}</div>
      <div class="flex flex-col">
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-3 py-2 text-[10.5px] text-text-3 uppercase tracking-[0.06em] font-semibold border-b border-border-subtle">
          <span>{{ t('Hábito', 'Habit') }}</span>
          <span class="text-center">{{ t('Racha', 'Streak') }}</span>
          <span class="text-center">{{ t('Récord', 'Record') }}</span>
          <span class="text-center">30d</span>
        </div>
        <div
          v-for="{ h, s, pct30 } in habitStats" :key="h.id"
          class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-3 py-3 items-center border-b border-border-subtle last:border-0"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
              :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }">
              <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="13" />
            </div>
            <span class="text-[13px] font-medium text-text-1 truncate">{{ h.name }}</span>
          </div>
          <div class="text-center flex items-center justify-center gap-1">
            <FlameIcon :size="11" class="text-amber" />
            <span class="tnum text-[13px] font-semibold text-amber">{{ s.current }}</span>
          </div>
          <div class="tnum text-center text-[13px] text-text-2">{{ s.best }}</div>
          <div class="text-center">
            <span class="tnum text-[13px] font-semibold"
              :class="pct30 >= 0.7 ? 'text-mint' : pct30 >= 0.4 ? 'text-accent' : 'text-text-3'">
              {{ Math.round(pct30 * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
