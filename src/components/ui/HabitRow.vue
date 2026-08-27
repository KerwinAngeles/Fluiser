<script setup lang="ts">
import { computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { ICON_MAP } from '@/components/icons/AppIcons'
import { ENERGY, CATEGORIES } from '@/types'
import type { Habit } from '@/types'

const props = withDefaults(defineProps<{
  habit: Habit
  date?: string
  dense?: boolean
}>(), { dense: false })

const emit = defineEmits<{
  toggle: [habit: Habit]
  open: [habit: Habit]
}>()

const store = useFluiserStore()
const completion = computed(() => store.completion(props.habit.id, props.date))
const done = computed(() => !!completion.value)
const HabitIcon = computed(() => ICON_MAP[props.habit.icon] ?? ICON_MAP.Habits)
const catLabel = computed(() => CATEGORIES.find((c) => c.id === props.habit.category)?.label ?? '')
const energyInfo = computed(() => completion.value ? ENERGY.find((e) => e.id === completion.value!.energy) : null)

// 30-day completion ring around the checkbox — same rate30 formula as the
// habit card in HabitsView.vue, just rendered compactly here (redesign:
// "me gustaria que tuviera un círculo de progreso").
const RING_R = 15
const RING_LEN = 2 * Math.PI * RING_R
const rate30 = computed(() => {
  const cells = store.heatmapData(props.habit.id, 30).filter((c) => c.due > 0)
  return cells.length ? cells.filter((c) => c.count > 0).length / cells.length : 0
})
const ringOffset = computed(() => RING_LEN * (1 - rate30.value))
</script>

<template>
  <div
    class="group flex items-center gap-3.5 rounded-[14px] border border-border-subtle bg-bg-surface cursor-pointer transition-colors hover:bg-bg-elevated"
    :class="dense ? 'px-3.5 py-2.5' : 'px-4 py-3.5'"
    @click="emit('open', habit)"
  >
    <div class="hr-ring-wrap" :title="`${Math.round(rate30 * 100)}% · 30d`">
      <svg width="34" height="34" style="position:absolute;inset:0;transform:rotate(-90deg)">
        <circle cx="17" cy="17" :r="RING_R" stroke-width="2" fill="none" stroke="var(--border-default)" />
        <circle
          cx="17" cy="17" :r="RING_R" stroke-width="2" fill="none"
          :stroke="`var(--${habit.tone})`" stroke-linecap="round"
          :stroke-dasharray="RING_LEN" :stroke-dashoffset="ringOffset"
          style="transition: stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)"
        />
      </svg>
      <button :class="['h-check', done ? 'done' : '']" @click.stop="emit('toggle', habit)">
        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>
      </button>
    </div>

    <div
      class="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0"
      :style="{ background: `var(--${habit.tone}-soft)`, color: `var(--${habit.tone})` }"
    >
      <component :is="HabitIcon" :size="16" />
    </div>

    <div class="flex-1 min-w-0">
      <div
        class="text-[14.5px] font-medium transition-colors"
        :class="done ? 'text-text-3 line-through decoration-text-3' : 'text-text-1'"
      >{{ habit.name }}</div>
      <div v-if="!dense" class="flex gap-2.5 mt-0.5 text-xs text-text-3">
        <span>{{ catLabel }}</span>
        <template v-if="habit.time">
          <span>·</span>
          <span class="tnum">{{ habit.time }}</span>
        </template>
        <template v-if="completion?.note">
          <span>·</span>
          <span class="italic text-text-2">"{{ completion.note }}"</span>
        </template>
      </div>
    </div>

    <span
      v-if="done && energyInfo"
      class="pill"
      :style="{ background: `var(--${energyInfo.tone}-soft)`, color: `var(--${energyInfo.tone})` }"
    >{{ energyInfo.label }}</span>
  </div>
</template>

<style scoped>
.hr-ring-wrap {
  position: relative;
  width: 34px; height: 34px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}
.hr-ring-wrap .h-check { position: relative; }
</style>
