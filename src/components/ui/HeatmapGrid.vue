<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFluiserStore, ymd } from '@/stores/fluiser'
import { useLang } from '@/composables/useLang'

const props = withDefaults(defineProps<{
  habitId?: string | null
  weeks?: number
  showLabels?: boolean
  title?: string
}>(), { habitId: null, weeks: 17, showLabels: true })

const emit = defineEmits<{ cellClick: [cell: { date: string; count: number; due: number; level: number }] }>()

const store    = useFluiserStore()
const lang     = useLang()
const todayStr = ymd()

const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_ES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
const DOW_EN   = ['Mo','Tu','We','Th','Fr','Sa','Su']

const dowLabels = computed(() => lang.value === 'en' ? DOW_EN : DOW_ES)

const selectedKey = ref('')

// ── Build full heatmap data lookup ──────────────────────────────
const cellMap = computed(() => {
  const data = store.heatmapData(props.habitId, props.weeks * 7)
  return new Map(data.map(c => [c.date, c]))
})

// ── Available months list ────────────────────────────────────────
const availableMonths = computed(() => {
  const abbr    = lang.value === 'en' ? MONTH_EN : MONTH_ES
  const nowYear = new Date().getFullYear()
  const seen    = new Set<string>()
  const result: { key: string; label: string }[] = []

  for (const [dateStr] of cellMap.value) {
    const key = dateStr.slice(0, 7)
    if (!seen.has(key)) {
      seen.add(key)
      const y = parseInt(key.slice(0, 4))
      const m = parseInt(key.slice(5, 7)) - 1
      result.push({ key, label: abbr[m] + (y !== nowYear ? ` ${y}` : '') })
    }
  }
  return result
})

// Active month — defaults to the most recent one
const activeKey = computed(() => {
  const months = availableMonths.value
  if (!months.length) return ''
  const valid = months.some(m => m.key === selectedKey.value)
  return valid ? selectedKey.value : months[months.length - 1].key
})

function selectMonth(key: string) { selectedKey.value = key }

// ── Calendar grid for the active month ──────────────────────────
type CalSlot = { day: number; dateStr: string; level: number; count: number; due: number; inRange: boolean } | null

const calendar = computed((): { label: string; grid: CalSlot[] } | null => {
  const key = activeKey.value
  if (!key) return null

  const abbr    = lang.value === 'en' ? MONTH_EN : MONTH_ES
  const nowYear = new Date().getFullYear()
  const y = parseInt(key.slice(0, 4))
  const m = parseInt(key.slice(5, 7)) - 1

  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const firstDow    = (new Date(y, m, 1).getDay() + 6) % 7

  const grid: CalSlot[] = Array(firstDow).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const cell    = cellMap.value.get(dateStr)
    grid.push({ day: d, dateStr, level: cell?.level ?? 0, count: cell?.count ?? 0, due: cell?.due ?? 0, inRange: !!cell })
  }

  while (grid.length % 7 !== 0) grid.push(null)

  const label = `${abbr[m]} ${y !== nowYear ? y : ''}`
  return { label: label.trim(), grid }
})

// ── Month stats ──────────────────────────────────────────────────
const monthStats = computed(() => {
  if (!calendar.value) return { doneDays: 0, dueDays: 0, rate: 0, totalDone: 0 }
  const slots = calendar.value.grid.filter((s): s is NonNullable<CalSlot> => s !== null && s.inRange)
  const due   = slots.filter(s => s.due > 0)
  const done  = due.filter(s => s.count > 0)
  const totalDone = slots.reduce((a, s) => a + s.count, 0)
  const totalDue  = slots.reduce((a, s) => a + s.due,   0)
  return {
    doneDays: done.length,
    dueDays:  due.length,
    totalDone,
    rate: totalDue ? Math.round(totalDone / totalDue * 100) : 0,
  }
})

const rateColor = computed(() =>
  monthStats.value.rate >= 70 ? 'var(--mint)' :
  monthStats.value.rate >= 40 ? 'var(--amber)' : 'var(--rose)'
)
</script>

<template>
  <div class="cal-root">

    <!-- Header: title + month stats -->
    <div class="cal-header">
      <span v-if="title" class="cal-title">{{ title }}</span>
      <div v-if="calendar" class="cal-summary tnum">
        <span class="s-check">✓</span>
        <span class="s-days">{{ monthStats.doneDays }} {{ lang === 'en' ? 'days' : 'días' }}</span>
        <span class="s-sep">·</span>
        <span class="s-rate" :style="{ color: rateColor }">{{ monthStats.rate }}%</span>
      </div>
    </div>

    <!-- Month filter pills -->
    <div class="cal-filters">
      <button
        v-for="mo in availableMonths" :key="mo.key"
        class="cal-pill"
        :class="{ active: mo.key === activeKey }"
        @click="selectMonth(mo.key)"
      >{{ mo.label }}</button>
    </div>

    <!-- Calendar for selected month -->
    <div v-if="calendar" class="cal-body">

      <!-- Month title -->
      <div class="cal-month-title">{{ calendar.label }}</div>

      <!-- Day-of-week headers -->
      <div class="cal-dow-row">
        <span v-for="d in dowLabels" :key="d" class="cal-dow">{{ d }}</span>
      </div>

      <!-- Day cells -->
      <div class="cal-grid">
        <template v-for="(slot, i) in calendar.grid" :key="i">
          <div v-if="slot === null" class="cal-empty" />
          <div
            v-else
            class="cal-day"
            :data-l="slot.inRange ? slot.level : -1"
            :data-today="slot.dateStr === todayStr ? 'yes' : 'no'"
            :title="slot.inRange ? `${slot.dateStr}  ${slot.count}/${slot.due}` : slot.dateStr"
            @click="slot.inRange && emit('cellClick', { date: slot.dateStr, count: slot.count, due: slot.due, level: slot.level })"
          >
            <span class="cal-num">{{ slot.day }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer: legend + coverage -->
    <div class="cal-footer">
      <div class="cal-legend">
        <span class="leg-txt">{{ lang === 'en' ? 'less' : 'menos' }}</span>
        <div v-for="l in [0,1,2,3,4]" :key="l" class="leg-sw" :data-l="l" />
        <span class="leg-txt">{{ lang === 'en' ? 'more' : 'más' }}</span>
      </div>
      <span class="cal-cov tnum">
        {{ monthStats.doneDays }}/{{ monthStats.dueDays }} {{ lang === 'en' ? 'days' : 'días' }}
      </span>
    </div>

  </div>
</template>

<style scoped>
.cal-root { display: flex; flex-direction: column; gap: 0; }

/* ── Header ── */
.cal-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.cal-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-2);
}
.cal-summary { display: flex; align-items: center; gap: 5px; font-size: 12px; flex-shrink: 0; }
.s-check { color: var(--mint); }
.s-days  { color: var(--text-2); font-weight: 500; }
.s-sep   { color: var(--text-4); }
.s-rate  { font-weight: 700; font-size: 13px; }

/* ── Month filter pills ── */
.cal-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}
.cal-pill {
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.cal-pill:hover { color: var(--text-1); border-color: var(--border-default); }
.cal-pill.active {
  background: var(--accent-soft, var(--bg-elevated));
  color: var(--accent);
  border-color: transparent;
  font-weight: 600;
}

/* ── Calendar body ── */
.cal-body { display: flex; flex-direction: column; gap: 0; }

.cal-month-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 14px;
  letter-spacing: -0.01em;
}

.cal-dow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 5px;
}
.cal-dow {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-4);
  padding: 4px 0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-empty { aspect-ratio: 1; }

.cal-day {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hm-0);
  transition: transform 120ms ease, box-shadow 120ms ease;
  cursor: default;
}
.cal-day:hover { transform: scale(1.08); }

.cal-num {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* Out of range */
.cal-day[data-l="-1"] { background: transparent; }
.cal-day[data-l="-1"] .cal-num { color: var(--text-4); opacity: 0.35; }

/* Levels */
.cal-day[data-l="1"] { background: var(--hm-1); }
.cal-day[data-l="1"] .cal-num { color: var(--text-2); }
.cal-day[data-l="2"] { background: var(--hm-2); }
.cal-day[data-l="2"] .cal-num { color: var(--text-2); }
.cal-day[data-l="3"] { background: var(--hm-3); }
.cal-day[data-l="3"] .cal-num { color: var(--text-1); }
.cal-day[data-l="4"] { background: var(--hm-4); }
.cal-day[data-l="4"] .cal-num { color: var(--text-1); font-weight: 700; }

/* Today */
.cal-day[data-today="yes"] { box-shadow: 0 0 0 2px var(--text-1); }

/* ── Footer ── */
.cal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.cal-legend { display: flex; align-items: center; gap: 5px; }
.leg-sw {
  width: 11px; height: 11px;
  border-radius: 3px;
  background: var(--hm-0);
  flex-shrink: 0;
}
.leg-sw[data-l="1"] { background: var(--hm-1); }
.leg-sw[data-l="2"] { background: var(--hm-2); }
.leg-sw[data-l="3"] { background: var(--hm-3); }
.leg-sw[data-l="4"] { background: var(--hm-4); }
.leg-txt  { font-size: 10px; color: var(--text-3); }
.cal-cov  { font-size: 10px; color: var(--text-4); font-variant-numeric: tabular-nums; }
</style>
