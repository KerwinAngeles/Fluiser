<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useT, useMonths, useDays } from '@/composables/useLang'
import { useTheme } from '@/composables/useTheme'
import { getDashboardPhrase } from '@/composables/useStaticAI'
import { useToday } from '@/composables/useToday'
import { ICON_MAP, FlameIcon, SunIcon, MoonIcon, CheckIcon, ChevronIcon, CompassIcon, FocusIcon } from '@/components/icons/AppIcons'
import RingProgress from '@/components/ui/RingProgress.vue'
import HabitRow from '@/components/ui/HabitRow.vue'
import HabitDetailModal from '@/components/modals/HabitDetailModal.vue'
import CheckinModal from '@/components/modals/CheckinModal.vue'
import type { Habit, MorningCheckin, EveningCheckin } from '@/types'

const store = useFluiserStore()
const router = useRouter()
const t = useT()
const { lang } = useTheme()
const months = useMonths()
const days = useDays()

const { today, hour } = useToday()
const todayDate = computed(() => new Date(today.value + 'T00:00:00'))
const due = computed(() => store.dueToday)
const notDueToday = computed(() =>
  store.activeHabits.filter((h) => !due.value.find((d) => d.id === h.id))
)
const progress = computed(() => store.todayProgress)
const morning = computed(() => store.data.checkins[`${today.value}|morning`] as MorningCheckin | undefined)
const evening = computed(() => store.data.checkins[`${today.value}|evening`] as EveningCheckin | undefined)

const phrase = computed(() => getDashboardPhrase({ hour: hour.value, pct: progress.value.pct, lang: lang.value }))

const topStreaks = computed(() =>
  store.activeHabits
    .map((h) => ({ h, s: store.streakOf(h.id) }))
    .filter((x) => x.s.current > 0)
    .sort((a, b) => b.s.current - a.s.current)
    .slice(0, 4)
)

const activeMetas = computed(() => store.data.metas.filter((m) => m.status === 'active'))

function metaProgress(m: typeof store.data.metas[0]): number {
  if (!m.metric || m.metric.target === 0) return 0
  return Math.min(100, Math.round((m.metric.current / m.metric.target) * 100))
}

const progressLabel = computed(() => {
  const p = progress.value
  if (p.pct === 1) return t('Día redondo ✓', 'Day complete ✓')
  if (p.pct > 0.5) return t('Vas bien', 'Going well')
  if (p.pct > 0) return t('Empezando', 'Just starting')
  return t('Lienzo en blanco', 'Blank canvas')
})

const openHabit = ref<Habit | null>(null)
const checkinKind = ref<'morning' | 'evening' | null>(null)

function handleToggle(habit: Habit) {
  if (store.isDone(habit.id)) { store.toggleHabit(habit.id); return }
  openHabit.value = habit
}
</script>

<template>
  <div class="screen">
    <!-- Header -->
    <div class="flex items-stretch gap-7 mb-9">
      <div class="flex flex-col justify-center items-center pr-7 border-r border-border-subtle shrink-0">
        <div class="today-month tnum">{{ months.get(todayDate.getMonth()) }}</div>
        <div class="today-num tnum leading-none">{{ todayDate.getDate() }}</div>
        <div class="text-text-3 text-[13px] mt-1.5 capitalize">{{ days.get(todayDate.getDay()) }}</div>
      </div>
      <div class="flex flex-col justify-center flex-1 min-w-0">
        <div class="screen-eyebrow">{{ t('Fluiser hoy', 'Fluiser today') }}</div>
        <div class="serif text-[22px] leading-snug text-text-1 italic font-normal mt-1 max-w-lg tracking-tight">
          {{ phrase }}
        </div>
        <div v-if="morning?.intention" class="flex items-center gap-2 mt-3 text-[13px]">
          <CompassIcon :size="13" class="text-accent shrink-0" />
          <span class="text-text-2">{{ t('Intención:', 'Intention:') }}</span>
          <span class="text-text-1 truncate">{{ morning.intention }}</span>
        </div>
      </div>
    </div>

    <!-- Progress card + Check-ins -->
    <div class="grid grid-cols-[1.1fr_1fr] gap-4 mb-9">
      <!-- Progress ring card -->
      <div class="card flex items-center gap-6 p-7">
        <RingProgress :size="120" :stroke="9" :value="progress.pct" :label="`${progress.done}`" :sub="t(`de ${progress.total}`, `of ${progress.total}`)" />
        <div class="flex-1 min-w-0">
          <div class="card-title mb-1.5">{{ t('Hábitos del día', "Today's habits") }}</div>
          <div class="text-[21px] font-semibold tracking-tight text-text-1">{{ progressLabel }}</div>
          <div class="text-text-2 text-[13px] mt-1.5">
            {{ progress.pct === 1
              ? t('Todo hecho. Disfruta el resto.', 'All done. Enjoy the rest.')
              : t(`${progress.total - progress.done} por hacer. Sin prisa.`, `${progress.total - progress.done} left. No rush.`) }}
          </div>
          <div class="flex gap-2 mt-4">
            <button class="btn btn-primary btn-sm" @click="store.setFocus(true)">
              <FocusIcon :size="12" /> {{ t('Enfoque', 'Focus') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Check-ins card -->
      <div class="card p-5">
        <div class="card-title mb-3.5">{{ t('Tu día', 'Your day') }}</div>
        <div class="flex flex-col gap-2.5">
          <button
            class="text-left flex items-center gap-3 p-3 rounded-xl border transition-colors"
            :class="morning ? 'bg-accent-soft border-accent-glow' : 'bg-border-subtle border-border-default hover:bg-bg-elevated'"
            @click="checkinKind = 'morning'"
          >
            <div
              class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
              :class="morning ? 'bg-accent text-bg-base' : 'bg-bg-elevated text-text-2'"
            >
              <SunIcon :size="14" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium text-text-1">{{ t('Mañana', 'Morning') }}</div>
              <div class="text-xs text-text-3 mt-0.5 truncate">
                {{ morning ? (morning.intention || t('Completado ✓', 'Done ✓')) : t('30 segundos', '30 seconds') }}
              </div>
            </div>
            <CheckIcon v-if="morning" :size="14" class="text-accent shrink-0" />
            <ChevronIcon v-else :size="14" class="text-text-3 shrink-0" />
          </button>

          <button
            class="text-left flex items-center gap-3 p-3 rounded-xl border transition-colors"
            :class="[
              evening ? 'bg-accent-soft border-accent-glow' : 'bg-border-subtle border-border-default hover:bg-bg-elevated',
              !evening && hour < 18 ? 'opacity-40 pointer-events-none' : '',
            ]"
            @click="checkinKind = 'evening'"
          >
            <div
              class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
              :class="evening ? 'bg-accent text-bg-base' : 'bg-bg-elevated text-text-2'"
            >
              <MoonIcon :size="14" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium text-text-1">{{ t('Noche', 'Evening') }}</div>
              <div class="text-xs text-text-3 mt-0.5 truncate">
                {{ evening ? ((evening as EveningCheckin).reflection || t('Completado ✓', 'Done ✓')) : t('Disponible a las 6pm', 'Available at 6pm') }}
              </div>
            </div>
            <CheckIcon v-if="evening" :size="14" class="text-accent shrink-0" />
            <ChevronIcon v-else :size="14" class="text-text-3 shrink-0" />
          </button>
        </div>
      </div>
    </div>

    <!-- Habits list -->
    <div class="mb-9">
      <div class="flex items-end justify-between mb-4">
        <div>
          <div class="screen-eyebrow">{{ t('Para hoy', 'For today') }}</div>
          <h2 class="text-lg font-semibold text-text-1">
            {{ t(`${progress.done}/${progress.total} completados`, `${progress.done}/${progress.total} done`) }}
          </h2>
        </div>
        <button class="btn btn-ghost btn-sm" @click="router.push('/habits')">{{ t('Gestionar', 'Manage') }}</button>
      </div>
      <TransitionGroup name="list" tag="div" class="flex flex-col gap-1.5 relative">
        <HabitRow
          v-for="h in due" :key="h.id"
          :habit="h" :date="today"
          @toggle="handleToggle"
          @open="openHabit = $event"
        />
        <div v-if="due.length === 0" key="__empty" class="muted py-10 text-center italic text-sm">
          {{ t('Hoy no hay hábitos. Un día también puede ser sólo respirar.', 'No habits today. Some days are just for breathing.') }}
        </div>
      </TransitionGroup>

      <!-- Habits not scheduled today -->
      <div v-if="notDueToday.length > 0" class="mt-4 pt-4 border-t border-border-subtle">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-text-4 mb-2.5">
          {{ t('No programados hoy', 'Not scheduled today') }}
        </div>
        <div class="flex flex-col gap-1">
          <div
            v-for="h in notDueToday" :key="h.id"
            class="flex items-center gap-3 px-3 py-2 rounded-xl opacity-40"
          >
            <div
              class="w-6 h-6 rounded-[7px] grid place-items-center shrink-0"
              :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }"
            >
              <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="12" />
            </div>
            <span class="text-[13px] text-text-2 flex-1">{{ h.name }}</span>
            <span class="text-[11px] text-text-4">
              {{ h.freq === 'daily' ? '' : h.freq === 'mon,tue,wed,thu,fri' ? t('L–V', 'M–F') : h.freq === 'mon,wed,fri' ? 'L·X·V' : h.freq === 'sat,sun' ? t('Fin sem.', 'Wknd') : h.freq }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Streaks + Journal -->
    <div class="grid grid-cols-2 gap-4">
      <div class="card">
        <div class="card-title">{{ t('Rachas vivas', 'Active streaks') }}</div>
        <div v-if="topStreaks.length === 0" class="text-text-3 text-[13px] mt-3">
          {{ t('Aún sin rachas. Una marca a la vez.', 'No streaks yet. One mark at a time.') }}
        </div>
        <div class="flex flex-col gap-2.5 mt-3">
          <div v-for="{ h, s } in topStreaks" :key="h.id" class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-[26px] h-[26px] rounded-[7px] grid place-items-center shrink-0"
                :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }">
                <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="12" />
              </div>
              <span class="text-[13px] font-medium text-text-1 truncate max-w-[120px]">{{ h.name }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <FlameIcon :size="12" class="text-amber" />
              <span class="tnum text-[13px] font-semibold text-amber">{{ s.current }}</span>
              <span class="tnum text-text-3 text-[11px]">/ {{ s.best }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <div class="card-title mb-0">{{ t('Metas activas', 'Active goals') }}</div>
          <button class="btn btn-ghost btn-sm" @click="router.push('/goals')">{{ t('Ver', 'View') }}</button>
        </div>
        <div v-if="activeMetas.length === 0" class="text-text-3 text-[13px] mt-1">
          {{ t('Sin metas todavía.', 'No goals yet.') }}
        </div>
        <div class="flex flex-col gap-3 mt-1">
          <div v-for="m in activeMetas.slice(0, 3)" :key="m.id" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[13px] font-medium text-text-1 truncate">{{ m.title }}</span>
              <span v-if="m.metric" class="text-[11px] text-text-3 tnum shrink-0">{{ metaProgress(m) }}%</span>
            </div>
            <div v-if="m.metric" class="h-1 rounded-full overflow-hidden" style="background: var(--border-subtle)">
              <div
                class="h-full rounded-full transition-all"
                :style="{ width: metaProgress(m) + '%', background: `var(--${m.tone})` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <HabitDetailModal :habit="openHabit" @close="openHabit = null" />
    <CheckinModal :kind="checkinKind" @close="checkinKind = null" />
  </div>
</template>
