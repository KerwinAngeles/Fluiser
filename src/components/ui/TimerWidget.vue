<script setup lang="ts">
import { computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { ICON_MAP, CheckIcon, PlayIcon, PauseIcon } from '@/components/icons/AppIcons'

const store = useFluiserStore()
const t     = useT()

const ts             = computed(() => store.timerState)
const habit          = computed(() => store.activeTimer)
const phase          = computed(() => ts.value?.phase ?? 'work')
const remaining      = computed(() => ts.value?.remaining ?? 0)
const paused         = computed(() => ts.value?.paused ?? false)
const sessions       = computed(() => ts.value?.sessions ?? 1)
const currentSession = computed(() => ts.value?.currentSession ?? 1)
const workSec        = computed(() => ts.value?.workSec ?? 0)
const breakSec       = computed(() => ts.value?.breakSec ?? 0)
const isFlowCheck    = computed(() => phase.value === 'flow-check')
const totalSec       = computed(() => {
  if (isFlowCheck.value) return 12
  return phase.value === 'break' ? breakSec.value : workSec.value
})

const phaseColor = computed(() =>
  phase.value === 'break' ? 'var(--mint)' : `var(--${habit.value?.tone ?? 'sky'})`,
)
const phaseSoft = computed(() =>
  phase.value === 'break' ? 'var(--mint-soft)' : `var(--${habit.value?.tone ?? 'sky'}-soft)`,
)
const phaseLabel = computed(() => {
  if (isFlowCheck.value) return t('¿Flujo?', 'Flow?')
  if (phase.value === 'review') return t('Listo', 'Done')
  if (phase.value === 'break')  return t('Pausa', 'Break')
  return t('Enfoque', 'Focus')
})

const mm = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'))
const ss = computed(() => String(remaining.value % 60).padStart(2, '0'))

const MINI_R    = 14
const MINI_CIRC = 2 * Math.PI * MINI_R
const ringProgress   = computed(() => totalSec.value ? 1 - remaining.value / totalSec.value : 1)
const miniDashOffset = computed(() => MINI_CIRC * (1 - ringProgress.value))

// Flow-check ring (counts down visually)
const FC_R    = 14
const FC_CIRC = 2 * Math.PI * FC_R
const fcDash  = computed(() => FC_CIRC * (remaining.value / 12))

function expand() { store.expandTimer() }
function togglePause() {
  if (paused.value) store.resumeTimer()
  else store.pauseTimer()
}
</script>

<template>
  <Transition name="widget-slide">
    <div v-if="ts && store.timerMinimized" class="timer-widget">

      <!-- Identity -->
      <div class="tw-identity" @click="expand" :title="t('Expandir timer', 'Expand timer')">
        <div class="tw-icon" :style="{ background: phaseSoft, color: phaseColor }">
          <component :is="ICON_MAP[habit?.icon ?? 'Habits'] ?? ICON_MAP.Habits" :size="11" />
        </div>
        <div class="tw-info">
          <span class="tw-name">{{ habit?.name }}</span>
          <span class="tw-phase" :style="{ color: isFlowCheck ? phaseColor : undefined }"
            :class="{ 'tw-phase--pulse': isFlowCheck }">
            {{ phaseLabel }}
            <template v-if="sessions > 1 && !isFlowCheck"> · {{ currentSession }}/{{ sessions }}</template>
          </span>
        </div>
      </div>

      <div class="tw-sep" />

      <!-- ─ Review state ─ -->
      <div v-if="phase === 'review'" class="tw-review" @click="expand">
        <div class="tw-check-circle" :style="{ background: phaseSoft, color: phaseColor }">
          <CheckIcon :size="14" />
        </div>
        <span class="tw-done-label" :style="{ color: phaseColor }">{{ t('Ver', 'View') }}</span>
      </div>

      <!-- ─ Flow-check state ─ -->
      <div v-else-if="isFlowCheck" class="tw-flow" @click="expand">
        <svg :width="(FC_R+3)*2" :height="(FC_R+3)*2" style="transform:rotate(-90deg);flex-shrink:0">
          <circle :cx="FC_R+3" :cy="FC_R+3" :r="FC_R" stroke-width="2" fill="none" stroke="var(--border-subtle)" />
          <circle :cx="FC_R+3" :cy="FC_R+3" :r="FC_R" stroke-width="2" fill="none"
            :stroke="phaseColor" stroke-linecap="round"
            :stroke-dasharray="FC_CIRC" :stroke-dashoffset="FC_CIRC - fcDash"
            style="transition:stroke-dashoffset 1s linear"
          />
        </svg>
        <span class="tw-time tnum" :style="{ color: phaseColor }">{{ remaining }}s</span>
      </div>

      <!-- ─ Active timer ─ -->
      <div v-else class="tw-timer-wrap" @click="expand">
        <svg :width="(MINI_R+3)*2" :height="(MINI_R+3)*2" style="transform:rotate(-90deg);flex-shrink:0">
          <circle :cx="MINI_R+3" :cy="MINI_R+3" :r="MINI_R" stroke-width="2.5" fill="none" stroke="var(--border-subtle)" />
          <circle :cx="MINI_R+3" :cy="MINI_R+3" :r="MINI_R" stroke-width="2.5" fill="none"
            :stroke="phaseColor" stroke-linecap="round"
            :stroke-dasharray="MINI_CIRC" :stroke-dashoffset="miniDashOffset"
            style="transition:stroke-dashoffset 1s linear"
          />
        </svg>
        <span class="tw-time tnum">{{ mm }}:{{ ss }}</span>
      </div>

      <!-- Controls -->
      <div class="tw-controls">
        <!-- Flow-check: two inline mini buttons -->
        <template v-if="isFlowCheck">
          <button class="tw-btn tw-btn-flow" :style="{ color: phaseColor, borderColor: phaseColor }"
            @click.stop="store.continueFlow()" :title="t('+5 min flujo', '+5 min flow')">
            +5
          </button>
          <button class="tw-btn" @click.stop="store.finishTimerNow()" :title="t('Terminar', 'Finish')">
            <CheckIcon :size="11" />
          </button>
        </template>

        <!-- Normal controls -->
        <template v-else-if="phase !== 'review'">
          <button class="tw-btn" @click.stop="togglePause"
            :title="paused ? t('Reanudar', 'Resume') : t('Pausar', 'Pause')">
            <PauseIcon v-if="!paused" :size="13" />
            <PlayIcon  v-else         :size="13" />
          </button>
        </template>

        <!-- Expand button always visible -->
        <button class="tw-btn tw-btn-expand" @click.stop="expand" :title="t('Expandir', 'Expand')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3"  y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.timer-widget {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: var(--bg-glass);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid var(--border-default);
  box-shadow: 0 8px 32px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(255,255,255,0.04) inset;
  min-width: 260px;
  max-width: 360px;
  user-select: none;
}

.tw-identity {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; flex: 1; min-width: 0;
}
.tw-identity:hover .tw-name { color: var(--text-1); }

.tw-icon {
  width: 26px; height: 26px; border-radius: 8px;
  display: grid; place-items: center; flex-shrink: 0;
}
.tw-info {
  display: flex; flex-direction: column; gap: 1px; min-width: 0;
}
.tw-name {
  font-size: 12.5px; font-weight: 500; color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 200ms;
}
.tw-phase {
  font-size: 10.5px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-3); white-space: nowrap;
}
.tw-phase--pulse {
  animation: tw-phase-blink 1.2s ease-in-out infinite;
}
@keyframes tw-phase-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.tw-sep {
  width: 1px; height: 28px;
  background: var(--border-subtle); flex-shrink: 0;
}

.tw-timer-wrap, .tw-review, .tw-flow {
  display: flex; align-items: center; gap: 7px;
  cursor: pointer; flex-shrink: 0;
}

.tw-time {
  font-family: var(--font-display, monospace);
  font-size: 16px; font-weight: 500;
  letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
  color: var(--text-1); white-space: nowrap;
}

.tw-check-circle {
  width: 28px; height: 28px; border-radius: 50%;
  display: grid; place-items: center; flex-shrink: 0;
}
.tw-done-label { font-size: 12.5px; font-weight: 600; white-space: nowrap; }

.tw-flow { gap: 6px; }

.tw-controls {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.tw-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--bg-surface); color: var(--text-2);
  display: grid; place-items: center;
  cursor: pointer; transition: all 180ms; flex-shrink: 0;
  font-size: 11px; font-weight: 700;
}
.tw-btn:hover { color: var(--text-1); border-color: var(--border-strong); }
.tw-btn-flow { background: transparent; }
.tw-btn-flow:hover { background: var(--bg-surface); }
.tw-btn-expand {
  background: transparent; border-color: transparent; color: var(--text-3);
}
.tw-btn-expand:hover { background: var(--bg-surface); border-color: var(--border-default); color: var(--text-2); }

/* Entry/exit */
.widget-slide-enter-active {
  animation: widget-in 320ms cubic-bezier(0.16,1,0.3,1) both;
}
.widget-slide-leave-active {
  animation: widget-out 200ms cubic-bezier(0.32,0,0.67,0) both;
  pointer-events: none;
}
@keyframes widget-in  { from { opacity: 0; transform: translateY(12px) scale(0.95); } }
@keyframes widget-out { to   { opacity: 0; transform: translateY(8px)  scale(0.97); } }
</style>
