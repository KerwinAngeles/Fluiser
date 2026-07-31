<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useConfirm } from '@/composables/useConfirm'
import { ICON_MAP, XIcon, CheckIcon } from '@/components/icons/AppIcons'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { Meta, HabitIcon, Tone, MetaStatus } from '@/types'

const ICON_OPTS: HabitIcon[] = ['Brain','Run','Book','Water','Pen','Heart','Leaf','Bolt','Wave','Moon','Sun','Habits']
const TONE_OPTS: Tone[] = ['sky','mint','amber','rose','lilac']
const STATUS_OPTS: { id: MetaStatus; labelEs: string; labelEn: string }[] = [
  { id: 'active',   labelEs: 'Activa',   labelEn: 'Active'   },
  { id: 'achieved', labelEs: 'Lograda',  labelEn: 'Achieved' },
  { id: 'paused',   labelEs: 'Pausada',  labelEn: 'Paused'   },
]

const props = defineProps<{ meta: Meta | null; isNew?: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useFluiserStore()
const t = useT()
const { confirm } = useConfirm()

const cachedId = ref<string | null>(null)
const cachedIsNew = ref(false)
const title = ref('')
const tone = ref<Tone>('sky')
const icon = ref<HabitIcon>('Brain')
const deadline = ref('')
const status = ref<MetaStatus>('active')
const habitIds = ref<string[]>([])
const hasMetric = ref(false)
const metricLabel = ref('')
const metricTarget = ref(0)
const metricCurrent = ref(0)
const metricUnit = ref('')

watch(() => props.meta, (m) => {
  if (!m) return
  cachedId.value = m.id
  cachedIsNew.value = props.isNew ?? false
  title.value = m.title
  tone.value = m.tone
  icon.value = m.icon
  deadline.value = m.deadline ?? ''
  status.value = m.status
  habitIds.value = [...m.habitIds]
  hasMetric.value = !!m.metric
  metricLabel.value = m.metric?.label ?? ''
  metricTarget.value = m.metric?.target ?? 0
  metricCurrent.value = m.metric?.current ?? 0
  metricUnit.value = m.metric?.unit ?? ''
}, { immediate: true, flush: 'sync' })

const isValid = computed(() => title.value.trim().length > 0)

function toggleHabit(id: string) {
  const idx = habitIds.value.indexOf(id)
  if (idx >= 0) habitIds.value.splice(idx, 1)
  else habitIds.value.push(id)
}

function save() {
  if (!isValid.value || !cachedId.value) return
  store.upsertMeta({
    id: cachedId.value,
    title: title.value.trim(),
    tone: tone.value,
    icon: icon.value,
    deadline: deadline.value || undefined,
    status: status.value,
    habitIds: [...habitIds.value],
    metric: hasMetric.value && metricLabel.value.trim()
      ? { label: metricLabel.value.trim(), target: metricTarget.value, current: metricCurrent.value, unit: metricUnit.value.trim() }
      : undefined,
    createdAt: props.meta?.createdAt ?? store.utils.ymd(),
  })
  emit('saved')
  emit('close')
}

async function deleteMeta() {
  if (!cachedId.value) return
  const confirmed = await confirm({
    title: t('¿Eliminar esta meta?', 'Delete this goal?'),
    message: t('Esta acción no se puede deshacer.', 'This action cannot be undone.'),
    confirmLabel: t('Eliminar', 'Delete'),
    tone: 'danger',
  })
  if (confirmed) {
    store.deleteMeta(cachedId.value)
    emit('close')
  }
}
</script>

<template>
  <BaseModal :open="!!meta" width="min(560px, 92vw)" @close="emit('close')">
    <div v-if="cachedId" style="padding: 28px;">
      <div class="row" style="margin-bottom: 24px;">
        <h2 style="font-size: 18px;">{{ cachedIsNew ? t('Nueva meta', 'New goal') : t('Editar meta', 'Edit goal') }}</h2>
        <button class="btn btn-ghost btn-sm" style="margin-left: auto;" @click="emit('close')">
          <XIcon :size="14" />
        </button>
      </div>

      <!-- Title -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Meta', 'Goal') }}</div>
        <input class="input" :placeholder="t('¿Qué quieres lograr?', 'What do you want to achieve?')" v-model="title" />
      </div>

      <!-- Icon -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Icono', 'Icon') }}</div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
          <button
            v-for="ic in ICON_OPTS" :key="ic"
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
            v-for="t_ in TONE_OPTS" :key="t_"
            :style="{
              width: '28px', height: '28px', borderRadius: '50%',
              background: `var(--${t_})`,
              border: tone === t_ ? '2px solid var(--text-1)' : '2px solid transparent',
              outline: tone === t_ ? '2px solid var(--text-3)' : 'none',
              outlineOffset: '2px', transition: 'all 200ms',
            }"
            @click="tone = t_"
          />
        </div>
      </div>

      <!-- Deadline -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Fecha límite (opcional)', 'Deadline (optional)') }}</div>
        <input type="date" class="input" style="width: auto;" v-model="deadline" />
      </div>

      <!-- Status -->
      <div style="margin-bottom: 20px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Estado', 'Status') }}</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button
            v-for="s in STATUS_OPTS" :key="s.id"
            class="pill"
            :style="{
              cursor: 'pointer', padding: '5px 11px', fontWeight: 500,
              background: status === s.id ? 'var(--accent-soft)' : 'var(--border-subtle)',
              color: status === s.id ? 'var(--accent)' : 'var(--text-2)',
            }"
            @click="status = s.id"
          >{{ t(s.labelEs, s.labelEn) }}</button>
        </div>
      </div>

      <!-- Metric -->
      <div style="margin-bottom: 20px; padding: 16px; border-radius: 12px; background: var(--bg-elevated); border: 1px solid var(--border-default);">
        <div class="row" style="justify-content: space-between; margin-bottom: 12px;">
          <div>
            <div style="font-weight: 500; font-size: 14px;">{{ t('Métrica de progreso', 'Progress metric') }}</div>
            <div class="muted" style="font-size: 12px; margin-top: 2px;">{{ t('Ej: kilómetros, usuarios, capítulos…', 'e.g. kilometers, users, chapters…') }}</div>
          </div>
          <button
            :style="{
              width: '38px', height: '22px', borderRadius: '999px',
              background: hasMetric ? 'var(--accent)' : 'var(--border-default)',
              position: 'relative', transition: 'background 200ms',
            }"
            @click="hasMetric = !hasMetric"
          >
            <span :style="{
              position: 'absolute', width: '16px', height: '16px', borderRadius: '50%',
              background: 'white', top: '3px',
              left: hasMetric ? '19px' : '3px',
              transition: 'left 200ms',
            }" />
          </button>
        </div>
        <template v-if="hasMetric">
          <div style="margin-bottom: 10px;">
            <div class="card-title" style="margin-bottom: 6px;">{{ t('Nombre de la métrica', 'Metric name') }}</div>
            <input class="input" :placeholder="t('Ej: Usuarios activos', 'e.g. Active users')" v-model="metricLabel" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div>
              <div class="card-title" style="margin-bottom: 6px;">{{ t('Actual', 'Current') }}</div>
              <input type="number" class="input" min="0" v-model.number="metricCurrent" />
            </div>
            <div>
              <div class="card-title" style="margin-bottom: 6px;">{{ t('Meta', 'Target') }}</div>
              <input type="number" class="input" min="1" v-model.number="metricTarget" />
            </div>
            <div>
              <div class="card-title" style="margin-bottom: 6px;">{{ t('Unidad', 'Unit') }}</div>
              <input class="input" :placeholder="t('km, usuarios…', 'km, users…')" v-model="metricUnit" />
            </div>
          </div>
        </template>
      </div>

      <!-- Linked habits -->
      <div v-if="store.activeHabits.length > 0" style="margin-bottom: 24px;">
        <div class="card-title" style="margin-bottom: 8px;">{{ t('Hábitos que alimentan esta meta', 'Habits that feed this goal') }}</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label
            v-for="h in store.activeHabits" :key="h.id"
            style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 10px; border-radius: 10px; transition: background 160ms;"
            :style="{ background: habitIds.includes(h.id) ? `var(--${h.tone}-soft)` : 'var(--bg-elevated)' }"
          >
            <input type="checkbox" :checked="habitIds.includes(h.id)" @change="toggleHabit(h.id)" style="accent-color: var(--accent);" />
            <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="14" :style="{ color: `var(--${h.tone})` }" />
            <span style="font-size: 14px; color: var(--text-1);">{{ h.name }}</span>
          </label>
        </div>
      </div>

      <div class="row" style="justify-content: space-between;">
        <button v-if="!cachedIsNew" class="btn btn-ghost" style="color: var(--rose);" @click="deleteMeta">
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
