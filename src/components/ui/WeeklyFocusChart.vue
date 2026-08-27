<script setup lang="ts">
import { computed, ref } from 'vue'
import { useT } from '@/composables/useLang'

const t = useT()

const props = defineProps<{
  data: Array<{ date: string; dow: number; sec: number }>
  trend: number | null
  dowLabels: string[]
}>()

const hovered = ref<number | null>(null)

const maxSec = computed(() => Math.max(...props.data.map((d) => d.sec), 1))
const hasData = computed(() => props.data.some((d) => d.sec > 0))

// Percent height for the CSS bar — floored so an empty day still reads as a
// visible (if tiny) column rather than disappearing entirely.
function barPct(sec: number) {
  return Math.max((sec / maxSec.value) * 100, 4)
}

// Same percent math, expressed as an SVG y-coordinate (0 = top, 100 = base)
// in a viewBox that exactly overlays the CSS bar row below it.
function pointY(sec: number) {
  return 100 - barPct(sec)
}
function pointX(i: number) {
  return ((i + 0.5) / props.data.length) * 100
}
const linePoints = computed(() =>
  props.data.map((d, i) => `${pointX(i)},${pointY(d.sec)}`).join(' ')
)

function fmtHours(sec: number) {
  return `${(sec / 3600).toFixed(1)}h`
}
</script>

<template>
  <div class="wfc card">
    <div class="wfc-head">
      <div class="card-title" style="margin-bottom: 0;">{{ t('Horas de enfoque · 7 días', 'Focus hours · 7 days') }}</div>
      <div v-if="trend !== null" :class="['wfc-trend', trend >= 0 ? 'up' : 'down']">
        <span>{{ trend >= 0 ? '↗' : '↘' }}</span> {{ trend >= 0 ? '+' : '' }}{{ trend }}%
      </div>
    </div>

    <template v-if="hasData">
      <div class="wfc-plot" @mouseleave="hovered = null">
        <svg class="wfc-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            :points="linePoints" fill="none"
            stroke="var(--text-1)" stroke-opacity="0.35" stroke-width="1.2"
            stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"
          />
          <circle
            v-for="(d, i) in data" :key="d.date"
            :cx="pointX(i)" :cy="pointY(d.sec)" r="1.8"
            fill="var(--text-1)" :fill-opacity="hovered === i ? 1 : 0.55"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div class="wfc-bars">
          <div
            v-for="(d, i) in data" :key="d.date"
            class="wfc-bar-col"
            @mouseenter="hovered = i"
          >
            <div v-if="hovered === i" class="wfc-tooltip tnum">{{ fmtHours(d.sec) }}</div>
            <div class="wfc-bar" :class="{ today: i === data.length - 1 }" :style="{ height: barPct(d.sec) + '%' }" />
          </div>
        </div>
      </div>
      <div class="wfc-labels">
        <span v-for="d in data" :key="d.date">{{ dowLabels[d.dow] }}</span>
      </div>
    </template>
    <div v-else class="wfc-empty">
      {{ t('Sin sesiones esta semana todavía.', 'No sessions this week yet.') }}
    </div>
  </div>
</template>

<style scoped>
.wfc { display: flex; flex-direction: column; }
.wfc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--pad-4); }
.wfc-trend {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums;
}
.wfc-trend.up { color: var(--mint); }
.wfc-trend.down { color: var(--rose); }

.wfc-plot { position: relative; height: 120px; }
.wfc-line-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.wfc-bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 8px; }
.wfc-bar-col { flex: 1; min-width: 0; height: 100%; display: flex; align-items: flex-end; justify-content: center; position: relative; cursor: default; }
.wfc-bar {
  width: 100%;
  border-radius: 6px 6px 2px 2px;
  background: linear-gradient(180deg, var(--accent) 0%, var(--lilac) 100%);
  opacity: 0.55;
  transition: opacity 160ms ease, height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.wfc-bar-col:hover .wfc-bar, .wfc-bar.today { opacity: 1; }
.wfc-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 3px 9px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-1);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  pointer-events: none;
  z-index: 1;
}
.wfc-labels { display: flex; gap: 8px; margin-top: 10px; }
.wfc-labels span { flex: 1; text-align: center; font-size: 11px; color: var(--text-3); }
.wfc-empty { padding: 32px 0; text-align: center; font-size: 13px; color: var(--text-3); font-style: italic; }
</style>
