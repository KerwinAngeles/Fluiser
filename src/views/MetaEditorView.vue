<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useToday } from '@/composables/useToday'
import { useConfirm } from '@/composables/useConfirm'
import { ICON_MAP, XIcon, CheckIcon, ArrowLeftIcon } from '@/components/icons/AppIcons'
import type { Meta, HabitIcon, Tone, MetaStatus } from '@/types'

const ICON_OPTS: HabitIcon[] = ['Brain', 'Run', 'Book', 'Water', 'Pen', 'Heart', 'Leaf', 'Bolt', 'Wave', 'Moon', 'Sun', 'Habits']
const TONE_OPTS: Tone[] = ['sky', 'mint', 'amber', 'rose', 'lilac']
const STATUS_OPTS: { id: MetaStatus; labelEs: string; labelEn: string }[] = [
  { id: 'active', labelEs: 'Activa', labelEn: 'Active' },
  { id: 'achieved', labelEs: 'Lograda', labelEn: 'Achieved' },
  { id: 'paused', labelEs: 'Pausada', labelEn: 'Paused' },
]

const route = useRoute()
const router = useRouter()
const store = useFluiserStore()
const t = useT()
const { today } = useToday()
const { confirm } = useConfirm()

const isNewMeta = route.name === 'meta-new'
const metaId = isNewMeta ? crypto.randomUUID() : (route.params.id as string)

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
const createdAt = ref('')
const loaded = ref(false)

function seedFrom(m: Meta) {
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
  createdAt.value = m.createdAt
  loaded.value = true
}

if (isNewMeta) {
  seedFrom({
    id: metaId, title: '', tone: 'sky', icon: 'Brain', habitIds: [],
    status: 'active', createdAt: today.value,
  })
} else {
  watch(
    () => [store.loading, store.data.metas] as const,
    ([storeLoading, metas]) => {
      if (loaded.value) return
      const found = metas.find((m) => m.id === metaId)
      if (found) { seedFrom(found); return }
      if (!storeLoading) router.replace('/goals')
    },
    { immediate: true },
  )
}

const isValid = computed(() => title.value.trim().length > 0)

const metricProgress = computed(() => {
  if (!hasMetric.value || metricTarget.value === 0) return 0
  return Math.min(100, Math.round((metricCurrent.value / metricTarget.value) * 100))
})

function toggleHabit(id: string) {
  const idx = habitIds.value.indexOf(id)
  if (idx >= 0) habitIds.value.splice(idx, 1)
  else habitIds.value.push(id)
}

function categoryStyle(s: MetaStatus) {
  const active = status.value === s
  return {
    background: active ? 'var(--accent-soft)' : 'var(--border-subtle)',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    border: '1px solid ' + (active ? 'transparent' : 'var(--border-subtle)'),
    fontWeight: active ? '700' : '500',
    cursor: 'pointer',
  }
}

function iconStyle(ic: HabitIcon) {
  const active = icon.value === ic
  return {
    background: active ? `var(--${tone.value}-soft)` : 'var(--bg-elevated)',
    color: active ? `var(--${tone.value})` : 'var(--text-2)',
    border: '1px solid ' + (active ? `var(--${tone.value})` : 'var(--border-default)'),
  }
}

function colorStyle(c: Tone) {
  const active = tone.value === c
  return {
    background: `var(--${c})`,
    boxShadow: active ? `0 0 0 3px var(--bg-surface), 0 0 0 5px var(--${c})` : 'none',
    transform: active ? 'scale(1.14)' : 'scale(1)',
  }
}

function goBack() {
  router.push('/goals')
}

function save() {
  if (!isValid.value) return
  store.upsertMeta({
    id: metaId,
    title: title.value.trim(),
    tone: tone.value,
    icon: icon.value,
    deadline: deadline.value || undefined,
    status: status.value,
    habitIds: [...habitIds.value],
    metric: hasMetric.value && metricLabel.value.trim()
      ? { label: metricLabel.value.trim(), target: metricTarget.value, current: metricCurrent.value, unit: metricUnit.value.trim() }
      : undefined,
    createdAt: createdAt.value || store.utils.ymd(),
  })
  router.push('/goals')
}

async function deleteMeta() {
  const confirmed = await confirm({
    title: t('¿Eliminar esta meta?', 'Delete this goal?'),
    message: t('Esta acción no se puede deshacer.', 'This action cannot be undone.'),
    confirmLabel: t('Eliminar', 'Delete'),
    tone: 'danger',
  })
  if (confirmed) {
    store.deleteMeta(metaId)
    router.push('/goals')
  }
}
</script>

<template>
  <div v-if="loaded" class="screen heb-screen">
    <div class="screen-head">
      <button class="btn btn-ghost btn-sm" @click="goBack">
        <ArrowLeftIcon :size="14" /> {{ t('Metas', 'Goals') }}
      </button>
      <button class="btn btn-ghost btn-sm" @click="goBack">
        <XIcon :size="14" />
      </button>
    </div>

    <!-- Hero -->
    <div class="card heb-hero" :style="{ backgroundImage: `radial-gradient(120% 160% at 10% 0%, var(--${tone}-soft), transparent 65%)` }">
      <div class="row" style="align-items: center; gap: 18px; min-width: 0;">
        <div class="heb-icon" :style="{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }">
          <component :is="ICON_MAP[icon] ?? ICON_MAP.Habits" :size="28" />
        </div>
        <div style="min-width: 0; flex: 1;">
          <div class="card-title" style="margin-bottom: 8px;">
            {{ isNewMeta ? t('Nueva meta', 'New goal') : t('Editar meta', 'Edit goal') }}
          </div>
          <input
            class="heb-name"
            v-model="title"
            :placeholder="t('¿Qué quieres lograr?', 'What do you want to achieve?')"
          />
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="heb-body">
      <div class="col heb-col" style="gap: 20px;">

        <div class="card">
          <div class="card-title">{{ t('Estado', 'Status') }}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
            <button
              v-for="s in STATUS_OPTS"
              :key="s.id"
              class="pill"
              style="padding: 9px 16px; border-radius: 999px; font-size: 13px;"
              :style="categoryStyle(s.id)"
              @click="status = s.id"
            >{{ t(s.labelEs, s.labelEn) }}</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">{{ t('Icono', 'Icon') }}</div>
          <div class="heb-icon-grid">
            <button
              v-for="ic in ICON_OPTS"
              :key="ic"
              class="heb-icon-btn"
              :style="iconStyle(ic)"
              @click="icon = ic"
            >
              <component :is="ICON_MAP[ic] ?? ICON_MAP.Habits" :size="18" />
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">{{ t('Color', 'Color') }}</div>
          <div style="display: flex; gap: 14px; margin-top: 11px;">
            <button
              v-for="c in TONE_OPTS"
              :key="c"
              class="heb-swatch"
              :style="colorStyle(c)"
              @click="tone = c"
            />
          </div>
        </div>

        <div class="card">
          <div class="card-title">{{ t('Fecha límite (opcional)', 'Deadline (optional)') }}</div>
          <input type="date" class="input" style="margin-top: 10px; width: auto;" v-model="deadline" />
        </div>

        <div v-if="store.activeHabits.length > 0" class="card">
          <div class="card-title">{{ t('Hábitos que alimentan esta meta', 'Habits that feed this goal') }}</div>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
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

      </div>

      <div class="col heb-col" style="gap: 20px;">

        <div class="card" :style="{ backgroundImage: `radial-gradient(140% 120% at 20% 0%, var(--${tone}-soft), transparent 60%)` }">
          <div class="card-title">{{ t('Vista previa en vivo', 'Live preview') }}</div>
          <div class="heb-preview">
            <div class="row" style="gap: 14px;">
              <div class="heb-preview-icon" :style="{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }">
                <component :is="ICON_MAP[icon] ?? ICON_MAP.Habits" :size="22" />
              </div>
              <div style="min-width: 0;">
                <div style="font-weight: 700; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ title || t('Nombre de la meta', 'Goal name') }}
                </div>
                <div class="muted" style="font-size: 12px; margin-top: 2px;">{{ t(STATUS_OPTS.find(s => s.id === status)!.labelEs, STATUS_OPTS.find(s => s.id === status)!.labelEn) }}</div>
              </div>
            </div>
            <div v-if="deadline" class="row" style="gap: 8px; font-size: 12px; color: var(--text-2);">
              <span class="dot-sm" :style="{ background: `var(--${tone})` }" />{{ deadline }}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="row" style="justify-content: space-between; margin-bottom: 14px;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">{{ t('Métrica de progreso', 'Progress metric') }}</div>
              <div class="muted" style="font-size: 12px; margin-top: 2px;">{{ t('Ej: kilómetros, usuarios, capítulos…', 'e.g. kilometers, users, chapters…') }}</div>
            </div>
            <button
              class="heb-toggle"
              :style="{ background: hasMetric ? `var(--${tone})` : 'var(--border-default)' }"
              @click="hasMetric = !hasMetric"
            >
              <span class="heb-toggle-knob" :style="{ transform: hasMetric ? 'translateX(18px)' : 'translateX(2px)' }" />
            </button>
          </div>

          <template v-if="hasMetric">
            <div style="margin-bottom: 16px;">
              <div class="card-title" style="margin-bottom: 8px;">{{ t('Nombre de la métrica', 'Metric name') }}</div>
              <input class="input" :placeholder="t('Ej: Usuarios activos', 'e.g. Active users')" v-model="metricLabel" />
            </div>

            <div class="heb-stepper-grid" style="grid-template-columns: 1fr 1fr 1fr;">
              <div>
                <div class="heb-stepper-label">{{ t('Actual', 'Current') }}</div>
                <input type="number" class="input" min="0" v-model.number="metricCurrent" />
              </div>
              <div>
                <div class="heb-stepper-label">{{ t('Meta', 'Target') }}</div>
                <input type="number" class="input" min="1" v-model.number="metricTarget" />
              </div>
              <div>
                <div class="heb-stepper-label">{{ t('Unidad', 'Unit') }}</div>
                <input class="input" :placeholder="t('km, usuarios…', 'km, users…')" v-model="metricUnit" />
              </div>
            </div>

            <div class="muted" style="font-size: 12px; line-height: 1.6; margin-top: 14px;">
              {{ metricProgress }}% {{ t('completado', 'complete') }}
            </div>
          </template>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="heb-foot">
      <button
        v-if="!isNewMeta"
        class="btn btn-ghost"
        style="color: var(--rose);"
        @click="deleteMeta"
      >
        {{ t('Eliminar meta', 'Delete goal') }}
      </button>
      <span v-else />
      <div class="row">
        <button class="btn btn-ghost" @click="goBack">{{ t('Cancelar', 'Cancel') }}</button>
        <button class="btn btn-primary" :disabled="!isValid" @click="save">
          <CheckIcon :size="13" /> {{ t('Guardar meta', 'Save goal') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heb-screen { max-width: 1080px; }

.screen-head { justify-content: space-between; }

.heb-hero {
  display: flex;
  align-items: center;
  padding: 26px 28px;
  margin-bottom: 20px;
  background-repeat: no-repeat;
}
.heb-icon {
  width: 64px; height: 64px; border-radius: 18px;
  display: grid; place-items: center; flex-shrink: 0;
  transition: all var(--transition);
}
.heb-name {
  background: none; border: none; border-bottom: 2px solid var(--border-default);
  color: var(--text-1); font-family: var(--font-display);
  font-size: 26px; font-weight: 700; padding: 2px 0 6px;
  min-width: 0; max-width: 100%; width: 100%;
  transition: border-color var(--transition);
}
.heb-name:focus { border-color: var(--accent); outline: none; }

.heb-body {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}
.heb-col { display: flex; flex-direction: column; }

.heb-icon-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 10px; }
.heb-icon-btn {
  aspect-ratio: 1; border-radius: 12px; display: grid; place-items: center;
  cursor: pointer; transition: all var(--transition);
}

.heb-swatch { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; transition: all var(--transition); }

.heb-preview { display: flex; flex-direction: column; gap: 14px; margin-top: 12px; }
.heb-preview-icon { width: 50px; height: 50px; border-radius: 15px; display: grid; place-items: center; flex-shrink: 0; }

.heb-toggle {
  width: 38px; height: 22px; border-radius: 999px; position: relative;
  cursor: pointer; transition: background var(--transition); flex-shrink: 0;
}
.heb-toggle-knob {
  position: absolute; width: 16px; height: 16px; border-radius: 50%;
  background: #fff; top: 3px; transition: transform var(--transition);
}

.heb-stepper-grid { display: grid; gap: 12px; transition: opacity var(--transition); }
.heb-stepper-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); margin-bottom: 6px; }

.heb-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-subtle);
}

@media (max-width: 780px) {
  .heb-body { grid-template-columns: 1fr; }
  .heb-hero { flex-direction: column; align-items: flex-start; }
}
</style>
