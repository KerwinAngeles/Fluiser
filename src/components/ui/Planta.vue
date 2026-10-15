<script setup lang="ts">
// Planta — per-habit growth indicator from fluiser-rediseno-v2.html. Stage
// 0-3, same threshold the app already uses for "hábito formado" (21-day
// streak, see FORMED_STREAK_DAYS in useFlowJournal.ts) — stage is derived by
// the caller from the current streak, not computed here.
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  stage: 0 | 1 | 2 | 3
  grew?: boolean // true right after the stage increases — plays the "stretch" pop
}>(), {
  grew: false,
})

const h = computed(() => [0, 16, 28, 38][props.stage])
const leaf1 = computed(() => {
  const a = 48 - h.value * 0.35
  return { a, d: `M30 ${a} C22 ${a - 4} 18 ${a - 2} 16 ${a + 2} C22 ${a + 5} 27 ${a + 4} 30 ${a}Z` }
})
const leaf2 = computed(() => {
  const b = 46 - h.value * 0.7
  return `M30 ${b} C38 ${b - 4} 42 ${b - 2} 44 ${b + 2} C38 ${b + 5} 33 ${b + 4} 30 ${b}Z`
})
const flowerY = computed(() => 52 - h.value)
</script>

<template>
  <svg class="planta-svg" :class="{ crece: grew }" viewBox="0 0 60 70" aria-hidden="true">
    <path d="M16 56h28l-3 12H19z" fill="var(--tierra)" />
    <rect x="13" y="52" width="34" height="6" rx="3" fill="var(--tierra)" />
    <ellipse v-if="stage === 0" cx="30" cy="50" rx="5" ry="3.5" fill="var(--mint)" />
    <template v-else>
      <path :d="`M30 52 L30 ${52 - h}`" stroke="var(--mint)" stroke-width="3" stroke-linecap="round" />
      <path :d="leaf1.d" fill="var(--mint)" />
      <path v-if="stage >= 2" :d="leaf2" fill="var(--mint)" />
      <g v-if="stage === 3" fill="var(--amber)">
        <circle cx="30" :cy="flowerY - 5" r="4" />
        <circle cx="35" :cy="flowerY" r="4" />
        <circle cx="25" :cy="flowerY" r="4" />
        <circle cx="30" :cy="flowerY + 5" r="4" />
      </g>
      <circle v-if="stage === 3" cx="30" :cy="flowerY" r="3" fill="var(--bg-surface)" />
    </template>
  </svg>
</template>

<style scoped>
.planta-svg { width: 56px; height: 64px; transform-origin: 50% 100%; }
.planta-svg.crece { animation: crecer var(--m-suave) var(--ease-rebote); }
@keyframes crecer { from { transform: scaleY(.8); } to { transform: scaleY(1); } }
</style>
