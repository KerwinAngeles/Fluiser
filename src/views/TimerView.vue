<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFluiserStore, ymd } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useSessionHistory } from '@/composables/useSessionHistory'
import { ICON_MAP, CheckIcon, XIcon, ChevronDownIcon, SkipFwdIcon, PlayIcon } from '@/components/icons/AppIcons'
import EnergyPicker from '@/components/ui/EnergyPicker.vue'
import SessionJourney from '@/components/ui/SessionJourney.vue'
import type { Energy } from '@/types'

const store = useFluiserStore()
const t = useT()
const habit = computed(() => store.activeTimer!)
const ts    = computed(() => store.timerState!)

const phase          = computed(() => ts.value?.phase ?? 'work')
const remaining      = computed(() => ts.value?.remaining ?? 0)
const currentSession = computed(() => ts.value?.currentSession ?? 1)
const paused         = computed(() => ts.value?.paused ?? false)
const sessions       = computed(() => ts.value?.sessions ?? 1)
const workSec        = computed(() => ts.value?.workSec ?? 0)
const breakSec       = computed(() => ts.value?.breakSec ?? 0)
const flowExtensions = computed(() => ts.value?.flowExtensions ?? 0)

const energy = ref<Energy>('effort')
const note   = ref('')

const reviewJourney = computed(() => {
  const j = ts.value?.journey ?? []
  if (!j.length) return []
  const closed = j[j.length - 1].endAt
    ? j
    : [...j.slice(0, -1), { ...j[j.length - 1], endAt: Date.now() }]
  return closed.map((seg) => ({
    type: seg.type,
    durationSec: Math.max(1, Math.round(((seg.endAt ?? Date.now()) - seg.startAt) / 1000)),
  }))
})

const phaseColor = computed(() =>
  phase.value === 'break' ? 'var(--mint)' : `var(--${habit.value?.tone ?? 'sky'})`,
)
const phaseSoft = computed(() =>
  phase.value === 'break' ? 'var(--mint-soft)' : `var(--${habit.value?.tone ?? 'sky'}-soft)`,
)
const phaseLabel = computed(() => {
  if (phase.value === 'work')       return t('Enfoque', 'Focus')
  if (phase.value === 'break')      return t('Pausa', 'Break')
  if (phase.value === 'flow-check') return t('¿Sigues en flujo?', 'Still in flow?')
  return t('Completado', 'Complete')
})

// ─ Gate: session/break just ended, waiting on the user to start the next one ─
const isGate = computed(() => phase.value === 'gate')
const gateIsBreak = computed(() => ts.value?.pendingPhase === 'break')
const gateTitle = computed(() =>
  gateIsBreak.value ? t('Sesión terminada', 'Session done') : t('Pausa terminada', 'Break done'),
)
const gateButtonLabel = computed(() =>
  gateIsBreak.value
    ? t('Comenzar pausa', 'Start break')
    : t(`Comenzar sesión ${currentSession.value + 1}`, `Start session ${currentSession.value + 1}`),
)

// Ring
const R    = 148
const CIRC = 2 * Math.PI * R
const totalSec = computed(() => {
  if (phase.value === 'flow-check') return 12
  if (phase.value === 'break')      return breakSec.value
  return workSec.value
})
const ringValue  = computed(() => totalSec.value ? 1 - remaining.value / totalSec.value : 1)
const dashOffset = computed(() => CIRC * (1 - ringValue.value))

const mm = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'))
const ss = computed(() => String(remaining.value % 60).padStart(2, '0'))

// Flow-check mini ring
const FC_R    = 48
const FC_CIRC = 2 * Math.PI * FC_R
const fcDash  = computed(() => FC_CIRC * (remaining.value / 12))

function completeHabit() {
  if (!habit.value || !ts.value) return
  const habitId = habit.value.id
  const segs = reviewJourney.value
  const actualSec = segs.filter((s) => s.type !== 'pause').reduce((sum, s) => sum + s.durationSec, 0)
  const { addSession } = useSessionHistory(habitId)
  addSession({
    date: ymd(),
    ts: Date.now(),
    plannedSec: ts.value.workSec * ts.value.sessions,
    actualSec,
    energy: energy.value,
    note: note.value,
    flowExtensions: ts.value.flowExtensions,
    journey: segs,
  }).catch(console.error)
  store.toggleHabit(habitId, ymd(), { energy: energy.value, note: note.value })
  store.stopTimer()
}

function cancelTimer() {
  store.stopTimer()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') store.minimizeTimer()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="timer-gate">
    <!-- Minimize button -->
    <button class="timer-back-btn" @click="store.minimizeTimer()">
      <ChevronDownIcon :size="13" />
      {{ t('Minimizar', 'Minimize') }}
    </button>

    <!-- ─────────── REVIEW SCREEN ─────────── -->
    <div v-if="phase === 'review'"
      class="timer-panel"
      style="animation:screen-in 360ms cubic-bezier(0.16,1,0.3,1)">

      <div class="review-icon" :style="{ background: phaseSoft, color: phaseColor }">
        <CheckIcon :size="36" />
      </div>

      <div class="screen-eyebrow">{{ t('Sesión cerrada', 'Session closed') }}</div>
      <h1 class="review-title">{{ habit?.name }}</h1>
      <div class="serif review-sub">
        {{ sessions }} {{ sessions === 1 ? t('sesión completa', 'complete session') : t('sesiones completas', 'complete sessions') }}
        · {{ (workSec / 60) * sessions }} {{ t('min contigo mismo', 'min with yourself') }}
        <span v-if="flowExtensions > 0" class="flow-badge-inline">
          · +{{ flowExtensions * 5 }} min {{ t('en flujo', 'in flow') }} 🌊
        </span>
      </div>

      <div v-if="reviewJourney.length > 1" style="margin-bottom:24px; text-align:left">
        <SessionJourney :segments="reviewJourney" :tone="habit?.tone ?? 'sky'" />
      </div>

      <div style="margin-bottom:20px; text-align:left">
        <div class="card-title" style="margin-bottom:10px; text-align:center">
          {{ t('¿Cómo se sintió?', 'How did it feel?') }}
        </div>
        <div style="display:flex; justify-content:center">
          <EnergyPicker v-model="energy" />
        </div>
      </div>

      <textarea class="input serif" rows="2"
        :placeholder="t('Una línea de contexto (opcional)…', 'A line of context (optional)…')"
        v-model="note"
        style="margin-bottom:24px; text-align:left"
      />
      <button class="btn btn-primary" style="padding:10px 22px; font-size:14px" @click="completeHabit">
        {{ t('Guardar y cerrar', 'Save and close') }}
      </button>
    </div>

    <!-- ─────────── FLOW-CHECK SCREEN ─────────── -->
    <div v-else-if="phase === 'flow-check'"
      class="timer-panel flow-check-panel"
      style="animation:screen-in 420ms cubic-bezier(0.16,1,0.3,1)">

      <!-- Ripple rings -->
      <div class="flow-ripples" :style="{ '--fc': phaseColor }">
        <div class="flow-ripple" />
        <div class="flow-ripple" style="animation-delay:0.8s" />
        <div class="flow-ripple" style="animation-delay:1.6s" />

        <!-- Countdown ring in the center -->
        <div class="flow-ring-wrap">
          <svg :width="(FC_R+6)*2" :height="(FC_R+6)*2" style="transform:rotate(-90deg)">
            <circle :cx="FC_R+6" :cy="FC_R+6" :r="FC_R" stroke-width="3" fill="none" stroke="var(--border-subtle)" />
            <circle :cx="FC_R+6" :cy="FC_R+6" :r="FC_R" stroke-width="3" fill="none"
              :stroke="phaseColor" stroke-linecap="round"
              :stroke-dasharray="FC_CIRC" :stroke-dashoffset="FC_CIRC - fcDash"
              style="transition:stroke-dashoffset 1s linear"
            />
          </svg>
          <div class="flow-countdown" :style="{ color: phaseColor }">{{ remaining }}</div>
        </div>
      </div>

      <!-- Habit chip -->
      <div class="flow-habit-chip">
        <div class="flow-habit-icon" :style="{ background: phaseSoft, color: phaseColor }">
          <component :is="ICON_MAP[habit?.icon ?? 'Habits'] ?? ICON_MAP.Habits" :size="13" />
        </div>
        <span>{{ habit?.name }}</span>
      </div>

      <div class="flow-headline">{{ t('¿Sigues en flujo?', 'Still in the zone?') }}</div>
      <div class="flow-sub-text">
        {{ t('Tu sesión terminó. Puedes añadir 5 minutos más sin romper el ritmo.', 'Your session ended. Add 5 more minutes without breaking your rhythm.') }}
      </div>

      <div v-if="flowExtensions > 0" class="flow-ext-badge">
        🌊 +{{ flowExtensions * 5 }} {{ t('min de flujo extra', 'min of extra flow') }}
      </div>

      <div class="flow-actions">
        <button class="btn btn-primary flow-continue-btn" @click="store.continueFlow()">
          🌊 {{ t('Continuar 5 min más', 'Continue 5 more min') }}
        </button>
        <button class="flow-end-btn" @click="store.finishTimerNow()">
          {{ t('Terminar sesión', 'End session') }}
        </button>
      </div>
    </div>

    <!-- ─────────── GATE: waiting for the user to start the next phase ─────────── -->
    <div v-else-if="isGate"
      class="timer-panel"
      style="max-width:440px; animation:screen-in 360ms cubic-bezier(0.16,1,0.3,1)">

      <div class="review-icon gate-icon" :style="{ background: phaseSoft, color: phaseColor }">
        <CheckIcon :size="34" />
      </div>

      <div class="screen-eyebrow">{{ t('Sesión cerrada', 'Session closed') }}</div>
      <h1 class="review-title" style="font-size:26px">{{ gateTitle }}</h1>
      <div class="serif review-sub" style="font-size:15px; margin-bottom:28px">
        {{ t('Cuando quieras seguir, comienza tú la siguiente parte.', 'Whenever you\'re ready, start the next part yourself.') }}
      </div>

      <button class="btn btn-primary gate-continue-btn" :style="{ background: phaseColor }" @click="store.continueGate()">
        <PlayIcon :size="13" /> {{ gateButtonLabel }}
      </button>

      <button class="cancel-link" @click="cancelTimer">
        <XIcon :size="11" /> {{ t('Cancelar sesión', 'Cancel session') }}
      </button>
    </div>

    <!-- ─────────── ACTIVE TIMER ─────────── -->
    <div v-else class="timer-panel" style="max-width:520px">
      <!-- Habit name + icon -->
      <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:6px">
        <div style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center"
          :style="{ background: phaseSoft, color: phaseColor }">
          <component :is="ICON_MAP[habit?.icon ?? 'Habits'] ?? ICON_MAP.Habits" :size="13" />
        </div>
        <div style="font-size:15px;font-weight:500">{{ habit?.name }}</div>
      </div>

      <!-- Phase label -->
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;font-weight:600;margin-bottom:36px;transition:color 400ms"
        :style="{ color: phaseColor }">{{ phaseLabel }}</div>

      <!-- Ring -->
      <div style="position:relative;width:320px;height:320px;margin:0 auto 36px">
        <svg width="320" height="320" style="transform:rotate(-90deg)">
          <circle cx="160" cy="160" r="148" stroke-width="6" fill="none" stroke="var(--border-subtle)" />
          <circle cx="160" cy="160" r="148" stroke-width="6" fill="none"
            :stroke="phaseColor" stroke-linecap="round"
            :stroke-dasharray="CIRC" :stroke-dashoffset="dashOffset"
            style="transition:stroke-dashoffset 1s linear,stroke 600ms"
          />
        </svg>
        <div style="position:absolute;inset:0;display:grid;place-items:center">
          <div>
            <div class="tnum" style="font-family:var(--font-display);font-size:76px;font-weight:500;letter-spacing:-0.04em;line-height:1;font-variant-numeric:tabular-nums;color:var(--text-1)">
              {{ mm }}<span style="color:var(--text-3)">:</span>{{ ss }}
            </div>
            <div class="muted" style="font-size:12px;margin-top:14px;text-transform:uppercase;letter-spacing:0.1em">
              {{ t(`Sesión ${currentSession} de ${sessions}`, `Session ${currentSession} of ${sessions}`) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Session dots -->
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:36px">
        <div v-for="i in sessions" :key="i"
          style="height:6px;border-radius:999px;transition:all 360ms"
          :style="{
            width: (i === currentSession && phase !== 'break') ? '24px' : '6px',
            background: i <= currentSession ? phaseColor : 'var(--border-default)',
            opacity: i > currentSession ? 0.5 : 1,
          }" />
      </div>

      <!-- Timer controls -->
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:28px">
        <button class="timer-ctrl-btn timer-ctrl-primary" :style="{ background: phaseColor }"
          @click="paused ? store.resumeTimer() : store.pauseTimer()">
          {{ paused ? `▶ ${t('Reanudar', 'Resume')}` : `‖ ${t('Pausar', 'Pause')}` }}
        </button>
        <button class="timer-ctrl-btn" @click="store.skipTimerSession()">
          <SkipFwdIcon :size="12" /> {{ t('Saltar', 'Skip') }}
        </button>
        <button class="timer-ctrl-btn" @click="store.finishTimerNow()">
          <CheckIcon :size="12" /> {{ t('Terminar', 'Finish') }}
        </button>
      </div>

      <!-- Cancel link -->
      <button class="cancel-link" @click="cancelTimer">
        <XIcon :size="11" /> {{ t('Cancelar sesión', 'Cancel session') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.timer-gate {
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 8, 0.52);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.timer-panel {
  position: relative;
  z-index: 10;
  text-align: center;
  width: 100%;
  padding: 0 40px;
  max-width: 520px;
}

.timer-back-btn {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  background: var(--bg-glass);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border: 1px solid var(--border-default);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms;
  box-shadow: var(--shadow-sm);
}
.timer-back-btn:hover { color: var(--text-1); border-color: var(--border-strong); }

/* ── Review ── */
.review-icon {
  width: 88px; height: 88px; border-radius: 50%;
  display: grid; place-items: center;
  margin: 0 auto 24px;
  animation: modal-in 500ms cubic-bezier(0.34,1.56,0.64,1);
}
.review-title {
  font-size: 32px; font-weight: 600; letter-spacing: -0.03em;
  margin-top: 8px; margin-bottom: 8px;
}
.review-sub {
  font-size: 17px; color: var(--text-2); font-style: italic; margin-bottom: 32px;
}
.flow-badge-inline {
  color: var(--accent, var(--sky));
  font-style: normal; font-weight: 500;
}

/* ── Gate ── */
.gate-icon { width: 76px; height: 76px; }
.gate-continue-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 26px; font-size: 14.5px;
  color: #0A0B0D; border-color: transparent;
}
.gate-continue-btn:hover { filter: brightness(0.94); }

/* ── Flow-check ── */
.flow-check-panel { max-width: 440px; }

.flow-ripples {
  position: relative;
  width: 120px; height: 120px;
  margin: 0 auto 32px;
}
.flow-ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--fc, var(--sky));
  opacity: 0;
  animation: flow-ripple-out 2.4s ease-out infinite;
}
@keyframes flow-ripple-out {
  0%   { transform: scale(0.4); opacity: 0.7; }
  100% { transform: scale(2.0); opacity: 0; }
}

.flow-ring-wrap {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.flow-countdown {
  position: absolute;
  font-family: var(--font-display, monospace);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.flow-habit-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px 5px 6px;
  border-radius: 999px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 20px;
}
.flow-habit-icon {
  width: 22px; height: 22px; border-radius: 6px;
  display: grid; place-items: center;
}

.flow-headline {
  font-size: 26px; font-weight: 600; letter-spacing: -0.03em;
  color: var(--text-1); margin-bottom: 10px;
}
.flow-sub-text {
  font-size: 14px; color: var(--text-2); line-height: 1.55;
  margin-bottom: 24px; max-width: 320px; margin-inline: auto;
}
.flow-ext-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  font-size: 12px; font-weight: 500; color: var(--text-2);
  margin-bottom: 20px;
}
.flow-actions { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.flow-continue-btn {
  padding: 12px 28px; font-size: 15px;
  width: 100%; max-width: 280px;
  animation: flow-btn-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
}
@keyframes flow-btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50%       { box-shadow: 0 0 0 6px var(--accent-soft, rgba(99,179,237,0.2)); }
}
.flow-end-btn {
  background: transparent; border: none;
  color: var(--text-3); font-size: 13px; cursor: pointer;
  padding: 4px 8px;
  transition: color 200ms;
}
.flow-end-btn:hover { color: var(--text-2); }

/* ── Timer controls ── */
.timer-ctrl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 10px;
  background: var(--bg-surface); color: var(--text-1);
  border: 1px solid var(--border-default);
  font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: all 200ms;
}
.timer-ctrl-btn:hover { border-color: var(--border-strong); }
.timer-ctrl-primary {
  color: #0A0B0D; border-color: transparent;
  min-width: 120px; justify-content: center;
}
.timer-ctrl-primary:hover { border-color: transparent; filter: brightness(0.92); }

.cancel-link {
  margin-top: 24px; background: transparent; border: none;
  color: var(--text-3); font-size: 12.5px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: color 200ms;
}
.cancel-link:hover { color: var(--text-2); }

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 200ms, transform 200ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
