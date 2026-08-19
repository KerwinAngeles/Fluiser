<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useT, useCatLabel, useLang } from '@/composables/useLang'
import { useToday } from '@/composables/useToday'
import { useConfirm } from '@/composables/useConfirm'
import { CATEGORIES } from '@/types'
import { ICON_MAP, XIcon, CheckIcon, ArrowLeftIcon } from '@/components/icons/AppIcons'
import type { Habit, CategoryId, HabitIcon, Tone, CategoryDef, HabitTimer } from '@/types'

const ICON_OPTS: HabitIcon[] = ['Brain', 'Run', 'Book', 'Water', 'Pen', 'Heart', 'Leaf', 'Bolt', 'Wave', 'Moon', 'Sun', 'Habits']
const TONE_OPTS: Tone[] = ['sky', 'mint', 'amber', 'rose', 'lilac']
const FREQ_PRESETS = [
  { id: 'daily', labelEs: 'Todos los días', labelEn: 'Every day' },
  { id: 'mon,tue,wed,thu,fri', labelEs: 'Días de semana', labelEn: 'Weekdays' },
  { id: 'mon,wed,fri', labelEs: 'L · X · V', labelEn: 'Mon · Wed · Fri' },
  { id: 'sat,sun', labelEs: 'Fin de semana', labelEn: 'Weekend' },
]
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DAY_LABELS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const route = useRoute()
const router = useRouter()
const store = useFluiserStore()
const t = useT()
const catLabel = useCatLabel()
const lang = useLang()
const { today } = useToday()
const { confirm } = useConfirm()

const isNewHabit = route.name === 'habit-new'
const habitId = isNewHabit ? crypto.randomUUID() : (route.params.id as string)

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
const active = ref(true)
const loaded = ref(false)

function seedFrom(h: { name: string; category: CategoryId; icon: HabitIcon; tone: Tone; time: string; freq: string; timer: HabitTimer; active?: boolean }) {
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
  active.value = h.active ?? true
  loaded.value = true
}

if (isNewHabit) {
  seedFrom({
    name: '', category: 'mente', icon: 'Brain', tone: 'sky', time: '', freq: 'daily',
    timer: { enabled: false, duration: 25, sessions: 1, breakDuration: 5 },
    active: true,
  })
} else {
  watch(
    () => [store.loading, store.data.habits] as const,
    ([storeLoading, habits]) => {
      if (loaded.value) return
      const found = habits.find((h) => h.id === habitId)
      if (found) { seedFrom(found); return }
      if (!storeLoading) router.replace('/habits')
    },
    { immediate: true },
  )
}

const isValid = computed(() => name.value.trim().length > 0)

const dayLabels = computed(() => (lang.value === 'en' ? DAY_LABELS_EN : DAY_LABELS_ES))

const selectedDays = computed<Set<string>>(() =>
  freq.value === 'daily' ? new Set(DAY_KEYS) : new Set(freq.value.split(',').map((s) => s.trim()).filter(Boolean))
)
const activeDaysCount = computed(() => selectedDays.value.size)

const dayItems = computed(() =>
  DAY_KEYS.map((key, idx) => ({ key, idx, label: dayLabels.value[idx], active: selectedDays.value.has(key) }))
)

function toggleDay(idx: number) {
  const key = DAY_KEYS[idx]
  const next = new Set(selectedDays.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  if (next.size === 0) return
  freq.value = next.size === 7 ? 'daily' : DAY_KEYS.filter((k) => next.has(k)).join(',')
}

const categoryLabel = computed(() => catLabel(category.value).label)

const previewBadge = computed(() =>
  timerEnabled.value
    ? `${timerDuration.value} min · ${timerSessions.value} ${timerSessions.value > 1 ? t('series', 'sets') : t('serie', 'set')}`
    : t('Sin cronómetro', 'No timer')
)

function categoryStyle(c: CategoryDef) {
  const active = category.value === c.id
  return {
    background: active ? `var(--${c.tone}-soft)` : 'var(--border-subtle)',
    color: active ? `var(--${c.tone})` : 'var(--text-2)',
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

function freqStyle(id: string) {
  const active = freq.value === id
  return {
    background: active ? 'var(--accent-soft)' : 'var(--border-subtle)',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    fontWeight: active ? '700' : '500',
    cursor: 'pointer',
  }
}

function dayStyle(active: boolean) {
  return {
    background: active ? `var(--${tone.value})` : 'var(--bg-elevated)',
    color: active ? '#0A0B0D' : 'var(--text-2)',
    border: '1px solid ' + (active ? `var(--${tone.value})` : 'var(--border-default)'),
  }
}

function adjustDuration(delta: number) { timerDuration.value = Math.min(180, Math.max(5, timerDuration.value + delta)) }
function adjustSessions(delta: number) { timerSessions.value = Math.min(12, Math.max(1, timerSessions.value + delta)) }
function adjustBreak(delta: number) { timerBreak.value = Math.min(60, Math.max(0, timerBreak.value + delta)) }

function goBack() {
  router.push('/habits')
}

function save() {
  if (!isValid.value) return
  store.upsertHabit({
    id: habitId,
    name: name.value.trim(),
    category: category.value,
    icon: icon.value,
    tone: tone.value,
    time: time.value,
    freq: freq.value,
    timer: { enabled: timerEnabled.value, duration: timerDuration.value, sessions: timerSessions.value, breakDuration: timerBreak.value },
    active: active.value,
  })
  router.push('/habits')
}

async function toggleActive() {
  const willActivate = !active.value
  const confirmed = await confirm({
    title: willActivate
      ? t('¿Reactivar este hábito?', 'Reactivate this habit?')
      : t('¿Inactivar este hábito?', 'Deactivate this habit?'),
    message: willActivate
      ? t('Volverá a aparecer en tus listas y en el dashboard.', 'It will show up again in your lists and dashboard.')
      : t('No aparecerá en tus listas, pero conservas su historial.', 'It will stop appearing in your lists, but its history is kept.'),
    confirmLabel: willActivate ? t('Reactivar', 'Reactivate') : t('Inactivar', 'Deactivate'),
    tone: willActivate ? 'default' : 'danger',
  })
  if (confirmed) {
    active.value = willActivate
    store.setHabitActive(habitId, willActivate)
    router.push('/habits')
  }
}
</script>

<template>
  <div v-if="loaded" class="screen heb-screen">
    <div class="screen-head">
      <button class="btn btn-ghost btn-sm" @click="goBack">
        <ArrowLeftIcon :size="14" /> {{ t('Hábitos', 'Habits') }}
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
            {{ isNewHabit ? t('Nuevo hábito', 'New habit') : t('Editar hábito', 'Edit habit') }} · {{ categoryLabel }}
          </div>
          <input
            class="heb-name"
            v-model="name"
            :placeholder="t('Nombre del hábito…', 'Habit name…')"
          />
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="heb-body">
      <div class="col heb-col" style="gap: 20px;">

        <div class="card">
          <div class="card-title">{{ t('Categoría', 'Category') }}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
            <button
              v-for="c in CATEGORIES"
              :key="c.id"
              class="pill"
              style="padding: 9px 16px; border-radius: 999px; font-size: 13px;"
              :style="categoryStyle(c)"
              @click="category = c.id"
            >{{ catLabel(c.id).label }}</button>
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
          <div class="card-title">{{ t('Frecuencia', 'Frequency') }}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
            <button
              v-for="p in FREQ_PRESETS"
              :key="p.id"
              class="pill"
              style="padding: 9px 14px; border-radius: 999px; font-size: 13px;"
              :style="freqStyle(p.id)"
              @click="freq = p.id"
            >{{ t(p.labelEs, p.labelEn) }}</button>
          </div>
          <div class="heb-day-row">
            <button
              v-for="d in dayItems"
              :key="d.key"
              class="heb-day-btn"
              :style="dayStyle(d.active)"
              @click="toggleDay(d.idx)"
            >{{ d.label }}</button>
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
                  {{ name || t('Nombre del hábito', 'Habit name') }}
                </div>
                <div class="muted" style="font-size: 12px; margin-top: 2px;">{{ categoryLabel }}</div>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <div
                v-for="d in dayItems"
                :key="d.key"
                class="heb-day-chip"
                :style="dayStyle(d.active)"
              >{{ d.label }}</div>
            </div>
            <div class="row" style="gap: 8px; font-size: 12px; color: var(--text-2);">
              <span class="dot-sm" :style="{ background: `var(--${tone})` }" />{{ previewBadge }}
            </div>
          </div>
          <div class="muted" style="font-size: 12px; line-height: 1.6; margin-top: 12px;">
            {{ activeDaysCount }} {{ t('días activos por semana — la constancia importa más que la intensidad.', 'active days per week — consistency matters more than intensity.') }}
          </div>
        </div>

        <div class="card">
          <div class="row" style="justify-content: space-between; margin-bottom: 14px;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">{{ t('Sesiones cronometradas', 'Timed sessions') }}</div>
              <div class="muted" style="font-size: 12px; margin-top: 2px;">{{ t('Activa el temporizador en modo enfoque', 'Activates the timer in Focus mode') }}</div>
            </div>
            <button
              class="heb-toggle"
              :style="{ background: timerEnabled ? `var(--${tone})` : 'var(--border-default)' }"
              @click="timerEnabled = !timerEnabled"
            >
              <span class="heb-toggle-knob" :style="{ transform: timerEnabled ? 'translateX(18px)' : 'translateX(2px)' }" />
            </button>
          </div>

          <div style="margin-bottom: 16px;">
            <div class="card-title" style="margin-bottom: 8px;">{{ t('Hora (opcional)', 'Time (optional)') }}</div>
            <input type="time" class="input" v-model="time" />
          </div>

          <div class="heb-stepper-grid" :style="{ opacity: timerEnabled ? 1 : 0.35, filter: timerEnabled ? 'none' : 'grayscale(.4)', pointerEvents: timerEnabled ? 'auto' : 'none' }">
            <div>
              <div class="heb-stepper-label">{{ t('Duración (min)', 'Duration (min)') }}</div>
              <div class="heb-stepper">
                <button class="heb-stepper-btn" @click="adjustDuration(-5)">–</button>
                <div class="heb-stepper-val">{{ timerDuration }}</div>
                <button class="heb-stepper-btn" @click="adjustDuration(5)">+</button>
              </div>
            </div>
            <div>
              <div class="heb-stepper-label">{{ t('Series', 'Sets') }}</div>
              <div class="heb-stepper">
                <button class="heb-stepper-btn" @click="adjustSessions(-1)">–</button>
                <div class="heb-stepper-val">{{ timerSessions }}</div>
                <button class="heb-stepper-btn" @click="adjustSessions(1)">+</button>
              </div>
            </div>
            <div>
              <div class="heb-stepper-label">{{ t('Descanso (min)', 'Break (min)') }}</div>
              <div class="heb-stepper">
                <button class="heb-stepper-btn" @click="adjustBreak(-5)">–</button>
                <div class="heb-stepper-val">{{ timerBreak }}</div>
                <button class="heb-stepper-btn" @click="adjustBreak(5)">+</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="heb-foot">
      <button
        v-if="!isNewHabit"
        class="btn btn-ghost"
        :style="{ color: active ? 'var(--rose)' : 'var(--mint)' }"
        @click="toggleActive"
      >
        {{ active ? t('Inactivar hábito', 'Deactivate habit') : t('Reactivar hábito', 'Reactivate habit') }}
      </button>
      <span v-else />
      <div class="row">
        <button class="btn btn-ghost" @click="goBack">{{ t('Cancelar', 'Cancel') }}</button>
        <button class="btn btn-primary" :disabled="!isValid" @click="save">
          <CheckIcon :size="13" /> {{ t('Guardar hábito', 'Save habit') }}
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

.heb-day-row { display: flex; gap: 6px; margin-top: 12px; }
.heb-day-btn {
  width: 34px; height: 34px; border-radius: 9px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all var(--transition);
}
.heb-day-chip {
  width: 23px; height: 23px; border-radius: 7px;
  display: grid; place-items: center;
  font-size: 10px; font-weight: 700;
}

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

/* minmax(0, 1fr) instead of a bare 1fr — otherwise each grid track refuses to
   shrink past its content's min-content width (the "DESCANSO (MIN)" label
   being the widest), so on narrow screens the grid overflows the card and
   clips the last stepper's "+" button past the edge. */
.heb-stepper-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; transition: opacity var(--transition); }
.heb-stepper-label {
  font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); margin-bottom: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.heb-stepper { display: flex; align-items: center; gap: 6px; }
.heb-stepper-btn {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--border-default); background: var(--bg-elevated);
  color: var(--text-1); font-size: 16px; cursor: pointer;
}
.heb-stepper-btn:hover { background: var(--bg-glass-hi); }
.heb-stepper-val { flex: 1; min-width: 0; text-align: center; font-size: 18px; font-weight: 700; }

.heb-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-subtle);
}

@media (max-width: 780px) {
  .heb-body { grid-template-columns: 1fr; }
  .heb-hero { flex-direction: column; align-items: flex-start; }
}
</style>
