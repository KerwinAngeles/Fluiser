<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT, useCatLabel } from '@/composables/useLang'
import { ICON_MAP, XIcon, ClockIcon } from '@/components/icons/AppIcons'
import BaseModal from '@/components/ui/BaseModal.vue'
import EnergyPicker from '@/components/ui/EnergyPicker.vue'
import type { Habit, Energy } from '@/types'

const props = defineProps<{ habit: Habit | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useFluiserStore()
const t = useT()
const catLabel = useCatLabel()

const energy = ref<Energy>('auto')
const note = ref('')
const done = ref(false)
const current = ref<Habit | null>(null)

watch(() => props.habit, (h) => {
  if (!h) return
  current.value = h
  const c = store.completion(h.id)
  if (c) { energy.value = c.energy; note.value = c.note; done.value = true }
  else { energy.value = 'auto'; note.value = ''; done.value = false }
}, { immediate: true, flush: 'sync' })

function complete() {
  if (!props.habit) return
  store.toggleHabit(props.habit.id, undefined, { energy: energy.value, note: note.value })
  emit('close')
}

function updateExisting() {
  if (!props.habit) return
  store.setEnergy(props.habit.id, energy.value)
  store.setNote(props.habit.id, note.value)
  emit('close')
}

function uncomplete() {
  if (!props.habit) return
  store.toggleHabit(props.habit.id)
  emit('close')
}

function startTimer() {
  if (!props.habit) return
  emit('close')
  store.startTimer(props.habit)
}

const notePlaceholder = computed(() =>
  t('Salí a correr aunque no quería…', 'Went running even though I didn\'t want to…')
)
</script>

<template>
  <BaseModal :open="!!habit" @close="emit('close')">
    <div v-if="current" style="padding: 28px;">
      <div class="row" style="margin-bottom: 20px;">
        <div :style="{
          width: '40px', height: '40px', borderRadius: '11px',
          background: `var(--${current.tone}-soft)`, color: `var(--${current.tone})`,
          display: 'grid', placeItems: 'center',
        }">
          <component :is="ICON_MAP[current.icon] ?? ICON_MAP.Habits" :size="18" />
        </div>
        <div>
          <h2 style="font-size: 17px;">{{ current.name }}</h2>
          <div class="muted" style="font-size: 12px;">{{ catLabel(current.category).label }}{{ current.time ? ` · ${current.time}` : '' }}</div>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-left: auto;" @click="emit('close')">
          <XIcon :size="14" />
        </button>
      </div>

      <div style="margin-bottom: 18px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('¿Cómo se sintió?', 'How did it feel?') }}</div>
        <EnergyPicker v-model="energy" />
      </div>

      <div>
        <div class="card-title" style="margin-bottom: 8px;">
          {{ t('Nota de contexto', 'Context note') }}
          <span style="text-transform: none; color: var(--text-3);">{{ t(' (opcional)', ' (optional)') }}</span>
        </div>
        <textarea
          class="input"
          rows="2"
          :placeholder="notePlaceholder"
          v-model="note"
        />
      </div>

      <div class="row" style="justify-content: space-between; margin-top: 22px;">
        <button v-if="done" class="btn btn-ghost" style="color: var(--rose);" @click="uncomplete">
          {{ t('Marcar como pendiente', 'Mark as pending') }}
        </button>
        <span v-else />
        <div class="row">
          <button class="btn btn-ghost" @click="emit('close')">{{ t('Cerrar', 'Close') }}</button>
          <button
            v-if="!done && current.timer?.enabled"
            class="btn"
            :style="{ color: `var(--${current.tone})`, borderColor: `var(--${current.tone})` }"
            @click="startTimer"
          >
            <ClockIcon :size="12" /> {{ t('Iniciar sesión', 'Start session') }}
          </button>
          <button class="btn btn-primary" @click="done ? updateExisting() : complete()">
            {{ done ? t('Guardar', 'Save') : t('Completar', 'Complete') }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
