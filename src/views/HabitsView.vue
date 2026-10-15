<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useToday } from '@/composables/useToday'
import { useFlui } from '@/composables/useFlui'
import { CATEGORIES } from '@/types'
import { ICON_MAP, PlusIcon } from '@/components/icons/AppIcons'
import Gotas from '@/components/ui/Gotas.vue'
import Planta from '@/components/ui/Planta.vue'
import type { Habit, CategoryId } from '@/types'

// Same 21-day threshold the app already uses for "hábito formado"
// (FORMED_STREAK_DAYS in useFlowJournal.ts) — stage 3 blooms there.
function plantStage(streak: number): 0 | 1 | 2 | 3 {
  if (streak >= 21) return 3
  if (streak >= 7) return 2
  if (streak >= 1) return 1
  return 0
}

const store = useFluiserStore()
const router = useRouter()
const t = useT()
const { today } = useToday()
const flui = useFlui()
onMounted(() => flui.consejo('habitos', t('Cada hábito es una planta. Florece cuando llevas 21 días seguidos.', 'Every habit is a plant. It blooms once you hit a 21-day streak.')))

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
    return { habit: h, streak, cells14, rate30, totalDone, doneToday: store.isDone(h.id, today.value), stage: plantStage(streak.current) }
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

    <!-- Habit rows -->
    <div class="lista">
      <TransitionGroup name="list" tag="div" class="relative">
        <div
          v-for="s in habitSummaries" :key="s.habit.id"
          class="hab"
          :style="{ '--tone': `var(--${s.habit.tone})`, '--tone-soft': `var(--${s.habit.tone}-soft)` }"
          @click="openEdit(s.habit)"
        >
          <span class="ico-h" :style="{ background: `var(--${s.habit.tone}-soft)`, color: `var(--${s.habit.tone})` }">
            <component :is="ICON_MAP[s.habit.icon] ?? ICON_MAP.Habits" :size="17" />
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="nom">{{ s.habit.name }}</span>
              <span v-if="s.habit.active === false" class="hc-inactive-chip">{{ t('Inactivo', 'Inactive') }}</span>
            </div>
            <small class="block">
              {{ t(`${s.streak.current} día${s.streak.current === 1 ? '' : 's'} seguidos`, `${s.streak.current} day${s.streak.current === 1 ? '' : 's'} in a row`) }},
              {{ s.rate30 }}% {{ t('en 30 días', 'in 30 days') }}
            </small>
            <Gotas :cells="s.cells14" :today="today" class="mt-2.5" />
          </div>
          <div class="hab-der">
            <div>
              <small>{{ t('Récord', 'Best') }} {{ s.streak.best }}</small>
              <small>{{ t('Total', 'Total') }} {{ s.totalDone }}</small>
            </div>
            <Planta :stage="s.stage" />
          </div>
        </div>

        <div v-if="habitSummaries.length === 0" key="__empty" class="py-12 text-center italic text-sm text-text-3">
          {{ showInactive
            ? t('No tienes hábitos inactivos.', 'You have no inactive habits.')
            : t('Ningún hábito en esta categoría todavía.', 'No habits in this category yet.') }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.hab { cursor: pointer; transition: background var(--m-base); }
.hab:hover { background: var(--bg-elevated); }
.hc-inactive-chip {
  font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  background: var(--rose-soft); color: var(--rose); flex-shrink: 0; white-space: nowrap;
}
</style>
