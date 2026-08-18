<script setup lang="ts">
import { onMounted } from 'vue'
import { useSessionHistory } from '@/composables/useSessionHistory'
import SessionJourney from '@/components/ui/SessionJourney.vue'
import { XIcon } from '@/components/icons/AppIcons'
import { ENERGY } from '@/types'
import type { Habit } from '@/types'

const props = defineProps<{ habit: Habit }>()
const emit = defineEmits<{ close: [] }>()

const { sessions, loading, load } = useSessionHistory(props.habit.id)
onMounted(() => load())

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`
}

function energyInfo(id: string) {
  return ENERGY.find((e) => e.id === id)
}
</script>

<template>
  <Teleport to="body">
    <div class="sh-overlay" @click.self="emit('close')">
      <div class="sh-modal">
        <div class="sh-header">
          <div>
            <div class="sh-title">{{ habit.name }}</div>
            <div class="sh-sub">Historial de sesiones</div>
          </div>
          <button class="sh-close" @click="emit('close')">
            <XIcon :size="14" />
          </button>
        </div>

        <div class="sh-body">
          <div v-if="loading" class="sh-empty" style="color:var(--text-3)">Cargando sesiones…</div>
          <div v-else-if="!sessions.length" class="sh-empty">
            Aún no hay sesiones guardadas para este hábito.
          </div>

          <div v-for="(s, i) in sessions" :key="i" class="sh-card">
            <div class="sh-card-top">
              <div class="sh-card-date">{{ fmtDate(s.date) }}</div>
              <div class="sh-card-meta">
                <span class="sh-dur">{{ fmtDur(s.actualSec) }}</span>
                <span
                  v-if="energyInfo(s.energy)"
                  class="sh-energy-pill"
                  :style="{ background: `var(--${energyInfo(s.energy)!.tone}-soft)`, color: `var(--${energyInfo(s.energy)!.tone})` }"
                >{{ energyInfo(s.energy)!.label }}</span>
                <span v-if="s.flowExtensions > 0" class="sh-flow-badge">🌊 +{{ s.flowExtensions * 5 }}m</span>
                <span v-if="s.pausedSec > 0" class="sh-flow-badge">⏸ {{ fmtDur(s.pausedSec) }}{{ s.pauseCount > 1 ? ` · ${s.pauseCount}x` : '' }}</span>
              </div>
            </div>
            <div v-if="s.journey.length > 1" class="sh-journey">
              <SessionJourney :segments="s.journey" :tone="habit.tone" />
            </div>
            <div v-if="s.note" class="sh-note">"{{ s.note }}"</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sh-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(5,6,8,0.48);
  backdrop-filter: blur(2px);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0;
}
@media (min-width: 560px) {
  .sh-overlay { align-items: center; padding: 24px; }
}

.sh-modal {
  width: 100%; max-width: 520px;
  max-height: 85vh;
  border-radius: 22px 22px 0 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: modal-in 340ms cubic-bezier(0.16,1,0.3,1);
}
@media (min-width: 560px) {
  .sh-modal { border-radius: 20px; }
}

.sh-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.sh-title { font-size: 16px; font-weight: 600; color: var(--text-1); }
.sh-sub { font-size: 12px; color: var(--text-3); margin-top: 2px; }
.sh-close {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  display: grid; place-items: center; cursor: pointer; color: var(--text-2);
  flex-shrink: 0;
  transition: all 200ms;
}
.sh-close:hover { color: var(--text-1); border-color: var(--border-strong); }

.sh-body {
  overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
}

.sh-empty { text-align: center; padding: 40px 20px; color: var(--text-3); font-size: 14px; }

.sh-card {
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
}

.sh-card-top {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.sh-card-date { font-size: 13px; font-weight: 500; color: var(--text-1); }
.sh-card-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sh-dur { font-size: 12px; color: var(--text-2); font-variant-numeric: tabular-nums; }
.sh-energy-pill {
  font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px;
}
.sh-flow-badge {
  font-size: 11px; color: var(--text-3);
}

.sh-journey { /* inherits SessionJourney styles */ }

.sh-note {
  font-size: 12.5px; color: var(--text-2); font-style: italic;
  line-height: 1.5;
}
</style>
