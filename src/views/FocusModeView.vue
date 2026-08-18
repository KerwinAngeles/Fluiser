<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT, useMonths } from '@/composables/useLang'
import { useToday } from '@/composables/useToday'
import { useStartHabitTimer } from '@/composables/useStartHabitTimer'
import { ICON_MAP, ArrowLeftIcon, ClockIcon } from '@/components/icons/AppIcons'
import HabitRow from '@/components/ui/HabitRow.vue'
import type { Habit } from '@/types'

const emit = defineEmits<{ exit: [] }>()
const store = useFluiserStore()
const t = useT()
const months = useMonths()
const { startHabitTimer } = useStartHabitTimer()

const { today } = useToday()
const todayDate = computed(() => new Date(today.value + 'T00:00:00'))
const due = computed(() => store.dueToday)
const progress = computed(() => store.todayProgress)
const runningRemaining = computed(() => store.timerState?.remaining ?? 0)

function handleToggle(habit: Habit) { store.toggleHabit(habit.id) }

function mmss(totalSec: number): string {
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function onKey(e: KeyboardEvent) { if (e.key === 'Escape') emit('exit') }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="focus-gate">
    <!-- Back button -->
    <button
      class="btn btn-ghost fixed top-5 left-6 z-10 gap-1.5 text-[13px]"
      @click="emit('exit')"
    >
      <ArrowLeftIcon :size="14" /> {{ t('Salir', 'Exit') }}
      <span class="text-[10px] opacity-60 ml-1 font-mono">Esc</span>
    </button>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-[560px] px-6">
      <!-- Date header -->
      <div class="text-center mb-10">
        <div class="screen-eyebrow">{{ t('Modo enfoque', 'Focus mode') }}</div>
        <div class="text-[32px] font-bold tracking-tight mt-1">
          {{ todayDate.getDate() }} {{ months.get(todayDate.getMonth()) }}
        </div>
        <div class="text-text-3 text-[13px] mt-1.5">
          {{ progress.done }}/{{ progress.total }} {{ t('completados', 'done') }}
        </div>
      </div>

      <!-- Habits -->
      <div class="flex flex-col gap-2">
        <template v-for="h in due" :key="h.id">
          <!-- Timer habit -->
          <div
            v-if="h.timer?.enabled && !store.isDone(h.id)"
            class="flex items-center gap-3.5 p-4 px-[18px] rounded-2xl bg-bg-surface border border-border-subtle"
          >
            <div
              class="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
              :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }"
            >
              <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="16" />
            </div>
            <div class="flex-1">
              <div class="text-[15px] font-medium text-text-1">{{ h.name }}</div>
              <div class="text-text-3 text-xs mt-0.5">{{ h.timer.sessions }}×{{ h.timer.duration }} min</div>
            </div>
            <button
              v-if="store.activeTimer?.id === h.id"
              class="btn btn-sm gap-1.5 bg-accent-soft text-accent border-transparent"
              @click="store.expandTimer()"
            >
              <ClockIcon :size="12" />
              {{ store.timerState?.paused ? t('Pausado', 'Paused') : t('En marcha', 'Running') }} · {{ mmss(runningRemaining) }}
            </button>
            <button v-else class="btn btn-primary btn-sm gap-1.5" @click="startHabitTimer(h)">
              <ClockIcon :size="12" /> {{ t('Iniciar →', 'Start →') }}
            </button>
          </div>

          <!-- Regular habit -->
          <HabitRow
            v-else
            :habit="h" :date="today" :dense="true"
            @toggle="handleToggle"
            @open="handleToggle"
          />
        </template>

        <div v-if="due.length === 0" class="text-center py-10 text-text-3 italic text-sm">
          {{ t('Nada por hoy. El espacio también es parte del ritmo.', 'Nothing for today. The space is part of the rhythm too.') }}
        </div>
      </div>

      <!-- Progress -->
      <div class="flex justify-center mt-10 opacity-50">
        <div class="text-xs text-text-3">{{ Math.round(progress.pct * 100) }}% {{ t('del día', 'of the day') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus-gate {
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 8, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 40;
}
</style>
