<script setup lang="ts">
import type { Tone } from '@/types'

// Reusable stat card: icon badge + big number + label + optional delta.
// Feeds the redesigned Dashboard/Flow Journal (Phase 1-2) — built here in
// Phase 0 so those phases only wire data, not new UI.
withDefaults(defineProps<{
  icon?: object
  tone?: Tone
  value: string | number
  label: string
  delta?: string
  deltaTone?: 'up' | 'down' | 'neutral'
}>(), {
  tone: 'sky',
  deltaTone: 'neutral',
})
</script>

<template>
  <div class="stat-tile card">
    <div v-if="icon" :class="['stat-tile-badge', `bg-tone-${tone}`]">
      <component :is="icon" :size="18" />
    </div>
    <div class="stat-tile-value tnum">{{ value }}</div>
    <div class="stat-tile-label">{{ label }}</div>
    <div v-if="delta" :class="['stat-tile-delta', `is-${deltaTone}`]">{{ delta }}</div>
  </div>
</template>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.stat-tile-badge {
  width: 34px; height: 34px;
  border-radius: var(--r-sm);
  display: grid;
  place-items: center;
  margin-bottom: 4px;
}
.stat-tile-value {
  font-family: var(--font-display);
  font-size: calc(30px * var(--type-scale));
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--text-1);
}
.stat-tile-label {
  font-size: 12.5px;
  color: var(--text-3);
}
.stat-tile-delta {
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
}
.stat-tile-delta.is-up { color: var(--mint); }
.stat-tile-delta.is-down { color: var(--rose); }
.stat-tile-delta.is-neutral { color: var(--text-3); }
</style>
