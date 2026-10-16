<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useAuthStore } from '@/stores/auth'
import { useT, useMonths, useDays } from '@/composables/useLang'
import { useTheme } from '@/composables/useTheme'
import { getDashboardPhrase } from '@/composables/useStaticAI'
import { useToday } from '@/composables/useToday'
import { useFlowJournal } from '@/composables/useFlowJournal'
import { useFlui } from '@/composables/useFlui'
import { ICON_MAP, FlameIcon, SunIcon, MoonIcon, CheckIcon, ChevronIcon, CompassIcon, FocusIcon } from '@/components/icons/AppIcons'
import Agua from '@/components/ui/Agua.vue'
import Flui from '@/components/ui/Flui.vue'
import HabitRow from '@/components/ui/HabitRow.vue'
import HabitDetailModal from '@/components/modals/HabitDetailModal.vue'
import CheckinModal from '@/components/modals/CheckinModal.vue'
import type { Habit, MorningCheckin, EveningCheckin } from '@/types'

const store = useFluiserStore()
const authStore = useAuthStore()
const router = useRouter()
const t = useT()
const { lang } = useTheme()
const months = useMonths()
const days = useDays()
const flui = useFlui()

const userName = computed(() => store.data.settings?.name || authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || '')

// KPIs already computed by useFlowJournal — Dashboard just reads them into
// the franja (sesiones limpias, hábitos formados), no new calculations.
const { weekStats, progressStats, load: loadFlow } = useFlowJournal()
onMounted(() => {
  loadFlow()
  flui.reaccionar('saludo', 1800)
  flui.consejo('hoy', t('Marca un hábito con el círculo para completarlo hoy.', 'Tap the circle to mark a habit done for today.'))
})

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

const bestStreak = computed(() => topStreaks.value[0] ?? null)

const activeMetas = computed(() => store.data.metas.filter((m) => m.status === 'active'))

function daysLeft(deadline?: string): number | null {
  if (!deadline) return null
  return store.utils.daysBetween(new Date(), new Date(deadline + 'T00:00:00'))
}

const progressLabel = computed(() => {
  const p = progress.value
  if (p.done === 0) return t('Lienzo en blanco', 'Blank canvas')
  if (p.done < p.total) return t('Va tomando forma', 'Taking shape')
  return t('Día completo', 'Day complete')
})
const progressSub = computed(() => {
  const p = progress.value
  if (p.done === 0) return t(`${p.total} por hacer. Sin prisa.`, `${p.total} to do. No rush.`)
  if (p.done < p.total) return t(`Te falta ${p.total - p.done}.`, `${p.total - p.done} left.`)
  return t('Todo hecho. Buen trabajo.', 'All done. Great work.')
})

const openHabit = ref<Habit | null>(null)
const checkinKind = ref<'morning' | 'evening' | null>(null)

// Flui reacts whenever a habit becomes done today, regardless of whether it
// went through the direct undo path or the energy-picker modal — celebra on
// a fully complete day, sorprendido on the first habit of the day (breaking
// the "blank canvas"), feliz otherwise.
watch(() => progress.value.done, (now, prev) => {
  if (now <= prev) return
  if (progress.value.pct === 1) flui.reaccionar('celebra', 2400)
  else if (prev === 0) flui.reaccionar('sorprendido', 1400)
  else flui.reaccionar('feliz', 1300)
})

function handleToggle(habit: Habit) {
  if (store.isDone(habit.id)) { store.toggleHabit(habit.id); return }
  openHabit.value = habit
}
</script>

<template>
  <div class="screen">
    <!-- Saludo — sober date block + greeting, no gradient card -->
    <div class="flex gap-4 items-center mb-4">
      <div class="flex flex-col items-center justify-center w-[68px] h-[74px] rounded-[18px] bg-bg-surface border border-border-default shrink-0">
        <small class="text-text-3 text-[11px] font-semibold">{{ months.get(todayDate.getMonth()) }}</small>
        <b class="text-[30px] leading-none tnum" style="font-family: var(--font-display)">{{ todayDate.getDate() }}</b>
        <small class="text-text-3 text-[11px] font-semibold capitalize">{{ days.get(todayDate.getDay()) }}</small>
      </div>
      <div class="min-w-0">
        <h3 class="text-[26px] font-semibold tracking-tight text-text-1">
          {{ userName ? t(`Hola, ${userName}`, `Hi, ${userName}`) : t('Hola', 'Hi') }}
        </h3>
        <p class="text-text-2 text-[14px] mt-0.5">{{ phrase }}</p>
        <div v-if="morning?.intention" class="flex items-center gap-2 mt-1.5 text-[13px]">
          <CompassIcon :size="13" class="text-accent shrink-0" />
          <span class="text-text-2">{{ t('Intención:', 'Intention:') }}</span>
          <span class="text-text-1 truncate">{{ morning.intention }}</span>
        </div>
      </div>
    </div>

    <!-- Franja — reuses KPIs already computed by useFlowJournal + the streak store -->
    <div class="franja compacta mb-5">
      <div><b class="tnum">{{ bestStreak ? t(`${bestStreak.s.current} días`, `${bestStreak.s.current} days`) : t('Sin racha', 'No streak') }}</b><span>{{ t('Racha más larga', 'Longest streak') }}</span></div>
      <div><b class="tnum">{{ t(`${progress.done} de ${progress.total}`, `${progress.done} of ${progress.total}`) }}</b><span>{{ t('Hábitos de hoy', `Today's habits`) }}</span></div>
      <div v-if="weekStats.weekCount === 0" class="vacio"><b>{{ t('Sin sesiones', 'No sessions') }}</b><span>{{ t('Sesiones limpias, 7 días', 'Clean sessions, 7 days') }}</span></div>
      <div v-else><b class="tnum">{{ Math.round(weekStats.cleanPct * 100) }}%</b><span>{{ t('Sesiones limpias, 7 días', 'Clean sessions, 7 days') }}</span></div>
      <div><b class="tnum">{{ t(`${progressStats.formedCount} de ${progressStats.totalHabits}`, `${progressStats.formedCount} of ${progressStats.totalHabits}`) }}</b><span>{{ t('Hábitos formados', 'Habits formed') }}</span></div>
    </div>

    <!-- Hoy grid: Para hoy + Rachas/Metas | Tu día -->
    <div class="grid grid-cols-[1.55fr_1fr] gap-4 items-start">
      <div>
        <div class="card p-0 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <h4 class="text-[16px] font-semibold">{{ t('Para hoy', 'For today') }}</h4>
            <span class="text-text-2 text-[13px] font-semibold">{{ t(`${progress.done} de ${progress.total} completados`, `${progress.done} of ${progress.total} done`) }}</span>
          </div>
          <TransitionGroup name="list" tag="div" class="relative flex flex-col gap-2 p-2">
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
        </div>

        <!-- Habits not scheduled today -->
        <div v-if="notDueToday.length > 0" class="mt-3">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-text-4 mb-2">
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

        <div class="grid grid-cols-2 gap-3 mt-3">
          <div class="card">
            <h4 class="text-[14px] font-semibold mb-2">{{ t('Rachas vivas', 'Active streaks') }}</h4>
            <div v-if="topStreaks.length === 0" class="vacio-flui">
              <Flui state="pista" :size="44" />
              {{ t('Completa un hábito hoy y mañana para encender tu primera racha.', 'Complete a habit today and tomorrow to light your first streak.') }}
            </div>
            <div v-else class="flex flex-col gap-2.5">
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
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-[14px] font-semibold">{{ t('Metas activas', 'Active goals') }}</h4>
              <button class="btn btn-ghost btn-sm" @click="router.push('/goals')">{{ t('Ver', 'View') }}</button>
            </div>
            <div v-if="activeMetas.length === 0" class="text-text-3 text-[13px] mt-1">
              {{ t('Sin metas todavía.', 'No goals yet.') }}
            </div>
            <div v-else v-for="m in activeMetas.slice(0, 1)" :key="m.id" class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <b class="text-[15px] font-medium block truncate">{{ m.title }}</b>
              </div>
              <span class="estado-tag" :class="daysLeft(m.deadline) !== null && daysLeft(m.deadline)! < 0 ? 'tag-coral' : 'tag-laguna'">
                {{ daysLeft(m.deadline) !== null && daysLeft(m.deadline)! < 0 ? t('Vencida', 'Overdue') : t('Activa', 'Active') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tu día -->
      <div class="card p-4">
        <h4 class="text-[16px] font-semibold mb-2.5">{{ t('Tu día', 'Your day') }}</h4>
        <div class="flex items-center gap-3">
          <Agua :progress="progress.pct * 100" :size="80">
            <b class="text-[22px] font-display leading-none" style="font-family: var(--font-display)">{{ progress.done }}</b>
            <small class="block text-[11px] text-text-3">{{ t(`de ${progress.total}`, `of ${progress.total}`) }}</small>
          </Agua>
          <div class="min-w-0">
            <b class="text-[18px] font-semibold block" style="font-family: var(--font-display)">{{ progressLabel }}</b>
            <p class="text-text-2 text-[13px] mt-0.5">{{ progressSub }}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button class="btn btn-primary btn-sm" @click="store.setFocus(true)">
            <FocusIcon :size="12" /> {{ t('Enfoque', 'Focus') }}
          </button>
        </div>
        <div class="flex flex-col gap-1.5 mt-3">
          <button
            class="rutina text-left w-full"
            @click="checkinKind = 'morning'"
          >
            <SunIcon :size="16" class="text-accent" />
            <div class="flex-1 min-w-0">
              <b class="text-[14px] block">{{ t('Rutina de mañana', 'Morning routine') }}</b>
              <small class="text-text-3 text-[12px]">
                {{ morning ? (morning.intention || t('Completado ✓', 'Done ✓')) : t('30 segundos', '30 seconds') }}
              </small>
            </div>
            <CheckIcon v-if="morning" :size="14" class="text-accent shrink-0" />
            <ChevronIcon v-else :size="14" class="text-text-3 shrink-0" />
          </button>
          <button
            class="rutina text-left w-full"
            :class="{ 'opacity-40 pointer-events-none': !evening && hour < 18 }"
            @click="checkinKind = 'evening'"
          >
            <MoonIcon :size="16" class="text-accent" />
            <div class="flex-1 min-w-0">
              <b class="text-[14px] block">{{ t('Rutina de noche', 'Evening routine') }}</b>
              <small class="text-text-3 text-[12px]">
                {{ evening ? ((evening as EveningCheckin).reflection || t('Completado ✓', 'Done ✓')) : t('Disponible a las 6 p. m.', 'Available at 6pm') }}
              </small>
            </div>
            <CheckIcon v-if="evening" :size="14" class="text-accent shrink-0" />
            <ChevronIcon v-else :size="14" class="text-text-3 shrink-0" />
          </button>
        </div>
      </div>
    </div>

    <HabitDetailModal :habit="openHabit" @close="openHabit = null" />
    <CheckinModal :kind="checkinKind" @close="checkinKind = null" />
  </div>
</template>

<style scoped>
/* Fits the whole "Hoy" dashboard in one viewport without scrolling — tighter
   screen padding and card padding than the global defaults. The .p-0 "Para
   hoy" list card is excluded since its header/rows already manage their own
   spacing. */
.screen { padding: 20px 28px 24px; }
.screen .card:not(.p-0) { padding: 16px; }

.rutina {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 14px; background: var(--bg-base);
  transition: background var(--m-base);
}
.rutina:hover { background: var(--bg-elevated); }
</style>

