<script setup lang="ts">
import { computed } from 'vue'
import type { TimerSegmentType } from '@/types'
import type { Tone } from '@/types'

interface Segment {
  type: TimerSegmentType
  durationSec: number
}

const props = defineProps<{
  segments: Segment[]
  tone: Tone
}>()

const COLOR: Record<TimerSegmentType, string> = {
  work: '',  // overridden with tone prop below
  break: 'var(--mint)',
  pause: 'var(--text-3)',
  flow: 'var(--amber)',
}

const LABEL: Record<TimerSegmentType, string> = {
  work: 'Trabajo',
  break: 'Descanso',
  pause: 'Pausa',
  flow: 'Flujo',
}

const total = computed(() => props.segments.reduce((sum, s) => sum + s.durationSec, 0))

const bars = computed(() =>
  props.segments.map((s) => ({
    ...s,
    pct: total.value > 0 ? (s.durationSec / total.value) * 100 : 0,
    color: s.type === 'work' ? `var(--${props.tone})` : COLOR[s.type],
    label: LABEL[s.type],
    mins: Math.round(s.durationSec / 60),
  })),
)

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}
</script>

<template>
  <div class="journey-root">
    <div class="journey-bar">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="bar-seg"
        :style="{ width: bar.pct + '%', background: bar.color }"
        :title="`${bar.label}: ${fmt(bar.durationSec)}`"
      />
    </div>
    <div class="journey-legend">
      <div v-for="(bar, i) in bars" :key="i" class="legend-item">
        <span class="legend-dot" :style="{ background: bar.color }" />
        <span class="legend-label">{{ bar.label }}</span>
        <span class="legend-dur">{{ fmt(bar.durationSec) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journey-root { display: flex; flex-direction: column; gap: 10px; }

.journey-bar {
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  background: var(--bg-elevated);
}

.bar-seg {
  height: 100%;
  transition: width 0.3s;
  min-width: 2px;
}

.journey-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-2);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label { color: var(--text-2); }
.legend-dur { color: var(--text-3); font-variant-numeric: tabular-nums; }
</style>
