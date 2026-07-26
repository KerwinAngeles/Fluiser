<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFluiserStore, ymd } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { ICON_MAP, CheckIcon, XIcon, ChevronIcon } from '@/components/icons/AppIcons'
import EnergyPicker from '@/components/ui/EnergyPicker.vue'
import type { Energy } from '@/types'

const store = useFluiserStore()
const t = useT()

const habit = computed(() => store.activeTimer!)
const cfg = computed(() => habit.value?.timer ?? { duration: 25, sessions: 1, breakDuration: 0 })
const sessions = computed(() => cfg.value.sessions || 1)
const workSec = computed(() => (cfg.value.duration || 25) * 60)
const breakSec = computed(() => (cfg.value.breakDuration || 0) * 60)

const currentSession = ref(1)
const phase = ref<'work' | 'break' | 'review'>('work')
const remaining = ref(0)
const paused = ref(false)
const energy = ref<Energy>('effort')
const note = ref('')

const phaseColor = computed(() =>
  phase.value === 'break' ? 'var(--mint)' : `var(--${habit.value?.tone ?? 'sky'})`,
)
const phaseSoft = computed(() =>
  phase.value === 'break' ? 'var(--mint-soft)' : `var(--${habit.value?.tone ?? 'sky'}-soft)`,
)
const phaseLabel = computed(() => {
  if (phase.value === 'work') return t('Enfoque', 'Focus')
  if (phase.value === 'break') return t('Pausa', 'Break')
  return t('Completado', 'Complete')
})

const R = 148
const CIRC = 2 * Math.PI * R
const totalSec = computed(() => (phase.value === 'break' ? breakSec.value : workSec.value))
const ringValue = computed(() => (totalSec.value ? 1 - remaining.value / totalSec.value : 1))
const dashOffset = computed(() => CIRC * (1 - ringValue.value))

const mm = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'))
const ss = computed(() => String(remaining.value % 60).padStart(2, '0'))

let interval: ReturnType<typeof setInterval> | null = null

function tick() {
  if (remaining.value <= 0) { advancePhase(); return }
  remaining.value--
}

function advancePhase() {
  if (phase.value === 'work') {
    playBell()
    if (currentSession.value >= sessions.value) {
      phase.value = 'review'
    } else if (breakSec.value > 0) {
      phase.value = 'break'; remaining.value = breakSec.value
    } else {
      currentSession.value++; remaining.value = workSec.value
    }
  } else if (phase.value === 'break') {
    playBell()
    currentSession.value++; phase.value = 'work'; remaining.value = workSec.value
  }
}

function togglePause() { paused.value = !paused.value }

function skipSession() {
  if (phase.value === 'work') {
    if (currentSession.value >= sessions.value) phase.value = 'review'
    else if (breakSec.value > 0) { phase.value = 'break'; remaining.value = breakSec.value }
    else { currentSession.value++; remaining.value = workSec.value }
  } else if (phase.value === 'break') {
    currentSession.value++; phase.value = 'work'; remaining.value = workSec.value
  }
}

function finishNow() {
  if (interval) { clearInterval(interval); interval = null }
  phase.value = 'review'
}

function completeHabit() {
  if (habit.value) {
    store.toggleHabit(habit.value.id, ymd(), { energy: energy.value, note: note.value })
    store.stopTimer()
  }
}

function cancelTimer() { store.stopTimer() }

function playBell() {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = 660; o.type = 'sine'
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4)
    o.connect(g); g.connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + 1.5)
    setTimeout(() => ctx.close(), 1600)
  } catch {}
}

watch(paused, (val) => {
  if (val) {
    if (interval) { clearInterval(interval); interval = null }
  } else if (phase.value !== 'review') {
    interval = setInterval(tick, 1000)
  }
})

watch(phase, (val) => {
  if (val === 'review' && interval) { clearInterval(interval); interval = null }
})

function onKey(e: KeyboardEvent) { if (e.key === 'Escape') cancelTimer() }

onMounted(() => {
  remaining.value = workSec.value
  interval = setInterval(tick, 1000)
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="timer-gate">
    <!-- Back button (top-left glass pill) -->
    <button
      class="timer-back-btn"
      @click="cancelTimer"
    >
      <ChevronIcon :size="13" style="transform:rotate(180deg)" />
      {{ t('Volver', 'Back') }}
    </button>

    <!-- ── REVIEW SCREEN ── -->
    <div v-if="phase === 'review'" class="relative z-10 text-center w-full px-10" style="max-width:520px; animation:screen-in 360ms cubic-bezier(0.16,1,0.3,1)">
      <div
        style="width:88px; height:88px; border-radius:50%; display:grid; place-items:center; margin:0 auto 24px; animation:modal-in 500ms cubic-bezier(0.34,1.56,0.64,1)"
        :style="{ background: phaseSoft, color: phaseColor }"
      >
        <CheckIcon :size="36" />
      </div>

      <div class="screen-eyebrow">{{ t('Sesión cerrada', 'Session closed') }}</div>
      <h1 style="font-size:32px; font-weight:600; letter-spacing:-0.03em; margin-top:8px; margin-bottom:8px">
        {{ habit?.name }}
      </h1>
      <div class="serif" style="font-size:17px; color:var(--text-2); font-style:italic; margin-bottom:32px">
        {{ sessions }} {{ sessions === 1 ? t('sesión completa', 'complete session') : t('sesiones completas', 'complete sessions') }} · {{ cfg.duration * sessions }} {{ t('minutos contigo mismo.', 'minutes with yourself.') }}
      </div>

      <div style="margin-bottom:20px; text-align:left">
        <div class="card-title" style="margin-bottom:10px; text-align:center">{{ t('¿Cómo se sintió?', 'How did it feel?') }}</div>
        <div style="display:flex; justify-content:center">
          <EnergyPicker v-model="energy" />
        </div>
      </div>

      <textarea
        class="input serif"
        rows="2"
        :placeholder="t('Una línea de contexto (opcional)…', 'A line of context (optional)…')"
        v-model="note"
        style="margin-bottom:24px; text-align:left"
      />
      <button class="btn btn-primary" style="padding:10px 22px; font-size:14px" @click="completeHabit">
        {{ t('Guardar y cerrar', 'Save and close') }}
      </button>
    </div>

    <!-- ── ACTIVE TIMER ── -->
    <div v-else class="relative z-10 text-center w-full px-10" style="max-width:520px">
      <!-- Habit name + icon -->
      <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:6px">
        <div
          style="width:26px; height:26px; border-radius:8px; display:grid; place-items:center"
          :style="{ background: phaseSoft, color: phaseColor }"
        >
          <component :is="ICON_MAP[habit?.icon ?? 'Habits'] ?? ICON_MAP.Habits" :size="13" />
        </div>
        <div style="font-size:15px; font-weight:500">{{ habit?.name }}</div>
      </div>

      <!-- Phase label -->
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.16em; font-weight:600; margin-bottom:36px; transition:color 400ms"
        :style="{ color: phaseColor }">
        {{ phaseLabel }}
      </div>

      <!-- Ring -->
      <div style="position:relative; width:320px; height:320px; margin:0 auto 36px">
        <svg width="320" height="320" style="transform:rotate(-90deg)">
          <circle cx="160" cy="160" r="148" stroke-width="6" fill="none" stroke="var(--border-subtle)" />
          <circle
            cx="160" cy="160" r="148" stroke-width="6" fill="none"
            :stroke="phaseColor"
            stroke-linecap="round"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="dashOffset"
            style="transition:stroke-dashoffset 1s linear, stroke 600ms"
          />
        </svg>
        <div style="position:absolute; inset:0; display:grid; place-items:center">
          <div>
            <div class="tnum" style="font-family:var(--font-display); font-size:76px; font-weight:500; letter-spacing:-0.04em; line-height:1; font-variant-numeric:tabular-nums; color:var(--text-1)">
              {{ mm }}<span style="color:var(--text-3)">:</span>{{ ss }}
            </div>
            <div class="muted" style="font-size:12px; margin-top:14px; text-transform:uppercase; letter-spacing:0.1em">
              {{ t(`Sesión ${currentSession} de ${sessions}`, `Session ${currentSession} of ${sessions}`) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Session dots -->
      <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:36px">
        <div
          v-for="i in sessions"
          :key="i"
          style="height:6px; border-radius:999px; transition:all 360ms"
          :style="{
            width: (i === currentSession && phase !== 'break') ? '24px' : '6px',
            background: (i < currentSession || (i === currentSession && phase === 'break'))
              ? phaseColor
              : (i === currentSession && phase !== 'break')
                ? phaseColor
                : 'var(--border-default)',
            opacity: i > currentSession ? 0.6 : 1,
          }"
        />
      </div>

      <!-- Controls -->
      <div style="display:flex; align-items:center; justify-content:center; gap:10px">
        <!-- Pausar / Reanudar (primary) -->
        <button
          class="timer-ctrl-btn timer-ctrl-primary"
          :style="{ background: phaseColor }"
          @click="togglePause"
        >
          {{ paused ? `▶ ${t('Reanudar', 'Resume')}` : `‖ ${t('Pausar', 'Pause')}` }}
        </button>
        <!-- Saltar -->
        <button class="timer-ctrl-btn" @click="skipSession">
          <ChevronIcon :size="12" /> {{ t('Saltar', 'Skip') }}
        </button>
        <!-- Terminar -->
        <button class="timer-ctrl-btn" @click="finishNow">
          <CheckIcon :size="12" /> {{ t('Terminar', 'Finish') }}
        </button>
      </div>

      <!-- Cancel link -->
      <button
        style="margin-top:40px; background:transparent; border:none; color:var(--text-3); font-size:12.5px; cursor:pointer; display:inline-flex; align-items:center; gap:6px"
        @click="cancelTimer"
      >
        <XIcon :size="11" /> {{ t('Cancelar sesión', 'Cancel session') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.timer-gate {
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 8, 0.50);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
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
.timer-back-btn:hover {
  color: var(--text-1);
  border-color: var(--border-strong);
}

.timer-ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  background: var(--bg-surface);
  color: var(--text-1);
  border: 1px solid var(--border-default);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms;
}
.timer-ctrl-btn:hover {
  border-color: var(--border-strong);
}
.timer-ctrl-primary {
  color: #0A0B0D;
  border-color: transparent;
  min-width: 120px;
  justify-content: center;
}
.timer-ctrl-primary:hover {
  border-color: transparent;
  filter: brightness(0.92);
}
</style>
