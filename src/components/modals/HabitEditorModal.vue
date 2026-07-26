<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { CATEGORIES, SUGGESTED } from '@/types'
import { ICON_MAP, XIcon, CheckIcon } from '@/components/icons/AppIcons'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { Habit, CategoryId, HabitIcon, Tone } from '@/types'

const ICON_OPTS: HabitIcon[] = ['Brain','Run','Book','Water','Pen','Heart','Leaf','Bolt','Wave','Moon','Sun','Habits']
const TONE_OPTS: Tone[] = ['sky','mint','amber','rose','lilac']
const FREQ_PRESETS = [
  { id: 'daily', labelEs: 'Todos los días', labelEn: 'Every day' },
  { id: 'mon,tue,wed,thu,fri', labelEs: 'Días de semana', labelEn: 'Weekdays' },
  { id: 'mon,wed,fri', labelEs: 'L · X · V', labelEn: 'Mon · Wed · Fri' },
  { id: 'sat,sun', labelEs: 'Fin de semana', labelEn: 'Weekend' },
]

const props = defineProps<{ habit: Habit | null; isNew?: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useFluiserStore()
const t = useT()

const name = ref('')
const category = ref<CategoryId>('mente')
const icon = ref<HabitIcon>('Brain')
const tone = ref<Tone>('sky')
const time = ref('')
const freq = ref('daily')
const timerEnabled = ref(false)
const timerDuration = ref(25)
const timerSessions = ref(1)
const timerBreak = ref(5)
const cachedId = ref<string | null>(null)
const cachedIsNew = ref(false)

watch(() => props.habit, (h) => {
  if (!h) return
  cachedId.value = h.id
  cachedIsNew.value = props.isNew ?? false
  name.value = h.name
  category.value = h.category
  icon.value = h.icon
  tone.value = h.tone
  time.value = h.time
  freq.value = h.freq
  timerEnabled.value = h.timer?.enabled ?? false
  timerDuration.value = h.timer?.duration ?? 25
  timerSessions.value = h.timer?.sessions ?? 1
  timerBreak.value = h.timer?.breakDuration ?? 5
}, { immediate: true, flush: 'sync' })

const isValid = computed(() => name.value.trim().length > 0)

function save() {
  if (!isValid.value || !cachedId.value) return
  store.upsertHabit({
    id: cachedId.value,
    name: name.value.trim(),
    category: category.value,
    icon: icon.value,
    tone: tone.value,
    time: time.value,
    freq: freq.value,
    timer: { enabled: timerEnabled.value, duration: timerDuration.value, sessions: timerSessions.value, breakDuration: timerBreak.value },
  })
  emit('saved')
  emit('close')
}

function deleteHabit() {
  if (!cachedId.value) return
  if (window.confirm(t('¿Eliminar este hábito?', 'Delete this habit?'))) {
    store.deleteHabit(cachedId.value)
    emit('close')
  }
}
</script>

<template>
  <BaseModal :open="!!habit" width="min(580px, 92vw)" @close="emit('close')">
    <div v-if="cachedId" style="padding: 28px;">
      <div class="row" style="margin-bottom: 24px;">
        <h2 style="font-size: 18px;">{{ cachedIsNew ? t('Nuevo hábito', 'New habit') : t('Editar hábito', 'Edit habit') }}</h2>
        <button class="btn btn-ghost btn-sm" style="margin-left: auto;" @click="emit('close')">
          <XIcon :size="14" />
        </button>
      </div>

      <!-- Name -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Nombre', 'Name') }}</div>
        <input class="input" :placeholder="t('Nombre del hábito…', 'Habit name…')" v-model="name" />
      </div>

      <!-- Category -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Categoría', 'Category') }}</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button
            v-for="c in CATEGORIES"
            :key="c.id"
            class="pill"
            :style="{
              cursor: 'pointer',
              background: category === c.id ? `var(--${c.tone}-soft)` : 'var(--border-subtle)',
              color: category === c.id ? `var(--${c.tone})` : 'var(--text-2)',
              border: '1px solid ' + (category === c.id ? 'transparent' : 'var(--border-subtle)'),
              padding: '5px 11px', fontWeight: 500,
            }"
            @click="category = c.id"
          >{{ c.label }}</button>
        </div>
      </div>

      <!-- Icon -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Icono', 'Icon') }}</div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
          <button
            v-for="ic in ICON_OPTS"
            :key="ic"
            :style="{
              padding: '10px', borderRadius: '10px', display: 'grid', placeItems: 'center',
              background: icon === ic ? `var(--${tone}-soft)` : 'var(--bg-elevated)',
              color: icon === ic ? `var(--${tone})` : 'var(--text-2)',
              border: '1px solid ' + (icon === ic ? `var(--${tone})` : 'var(--border-default)'),
              transition: 'all 200ms',
            }"
            @click="icon = ic"
          >
            <component :is="ICON_MAP[ic] ?? ICON_MAP.Habits" :size="16" />
          </button>
        </div>
      </div>

      <!-- Tone -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Color', 'Color') }}</div>
        <div style="display: flex; gap: 8px;">
          <button
            v-for="t_ in TONE_OPTS"
            :key="t_"
            :style="{
              width: '28px', height: '28px', borderRadius: '50%',
              background: `var(--${t_})`,
              border: tone === t_ ? '2px solid var(--text-1)' : '2px solid transparent',
              outline: tone === t_ ? '2px solid var(--text-3)' : 'none',
              outlineOffset: '2px',
              transition: 'all 200ms',
            }"
            @click="tone = t_"
          />
        </div>
      </div>

      <!-- Frequency -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Frecuencia', 'Frequency') }}</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button
            v-for="p in FREQ_PRESETS"
            :key="p.id"
            class="pill"
            :style="{
              cursor: 'pointer',
              background: freq === p.id ? 'var(--accent-soft)' : 'var(--border-subtle)',
              color: freq === p.id ? 'var(--accent)' : 'var(--text-2)',
              padding: '5px 11px', fontWeight: 500,
            }"
            @click="freq = p.id"
          >{{ t(p.labelEs, p.labelEn) }}</button>
        </div>
      </div>

      <!-- Time -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Hora (opcional)', 'Time (optional)') }}</div>
        <input type="time" class="input" style="width: auto;" v-model="time" />
      </div>

      <!-- Timer -->
      <div style="margin-bottom: 24px; padding: 16px; border-radius: 12px; background: var(--bg-elevated); border: 1px solid var(--border-default);">
        <div class="row" style="justify-content: space-between; margin-bottom: 12px;">
          <div>
            <div style="font-weight: 500; font-size: 14px;">{{ t('Sesiones cronometradas', 'Timed sessions') }}</div>
            <div class="muted" style="font-size: 12px; margin-top: 2px;">{{ t('Activa el timer al iniciar en Modo enfoque', 'Activates timer in Focus mode') }}</div>
          </div>
          <button
            :style="{
              width: '38px', height: '22px', borderRadius: '999px',
              background: timerEnabled ? 'var(--accent)' : 'var(--border-default)',
              position: 'relative', transition: 'background 200ms',
            }"
            @click="timerEnabled = !timerEnabled"
          >
            <span :style="{
              position: 'absolute', width: '16px', height: '16px', borderRadius: '50%',
              background: 'white', top: '3px',
              left: timerEnabled ? '19px' : '3px',
              transition: 'left 200ms',
            }" />
          </button>
        </div>

        <template v-if="timerEnabled">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div>
              <div class="card-title" style="margin-bottom: 6px;">{{ t('Duración (min)', 'Duration (min)') }}</div>
              <input type="number" class="input" min="1" max="120" v-model.number="timerDuration" />
            </div>
            <div>
              <div class="card-title" style="margin-bottom: 6px;">{{ t('Sesiones', 'Sessions') }}</div>
              <input type="number" class="input" min="1" max="10" v-model.number="timerSessions" />
            </div>
            <div>
              <div class="card-title" style="margin-bottom: 6px;">{{ t('Pausa (min)', 'Break (min)') }}</div>
              <input type="number" class="input" min="0" max="30" v-model.number="timerBreak" />
            </div>
          </div>
        </template>
      </div>

      <div class="row" style="justify-content: space-between;">
        <button v-if="!cachedIsNew" class="btn btn-ghost" style="color: var(--rose);" @click="deleteHabit">
          {{ t('Eliminar', 'Delete') }}
        </button>
        <span v-else />
        <div class="row">
          <button class="btn btn-ghost" @click="emit('close')">{{ t('Cancelar', 'Cancel') }}</button>
          <button class="btn btn-primary" :disabled="!isValid" @click="save">
            <CheckIcon :size="13" /> {{ t('Guardar', 'Save') }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
