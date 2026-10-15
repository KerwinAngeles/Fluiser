<script setup lang="ts">
// Gotas — 14-day habit history as droplets, replacing the old bar/dot
// track. Takes the same cells HabitsView.vue already computes via
// store.heatmapData(habitId, 14) — no new data needed.
import type { HeatmapCell } from '@/types'

defineProps<{
  cells: HeatmapCell[]
  today: string
}>()
</script>

<template>
  <div class="gotas">
    <i
      v-for="cell in cells" :key="cell.date"
      :class="{ si: cell.date !== today && cell.count > 0, hoy: cell.date === today }"
    />
  </div>
</template>

<style scoped>
.gotas { display: flex; gap: 6px; flex-wrap: wrap; }
.gotas i {
  width: 14px; height: 17px; display: block;
  background: var(--bg-elevated);
  clip-path: path('M7 0C9 4 14 7.5 14 11A7 7 0 0 1 0 11C0 7.5 5 4 7 0Z');
}
.gotas i.si { background: var(--accent); }
.gotas i.hoy { background: var(--accent-soft); box-shadow: inset 0 -4px 0 var(--accent); }
</style>
