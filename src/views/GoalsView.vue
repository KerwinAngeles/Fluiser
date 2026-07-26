<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useToday } from '@/composables/useToday'
import { ICON_MAP, PlusIcon } from '@/components/icons/AppIcons'
import MetaEditorModal from '@/components/modals/MetaEditorModal.vue'
import VisionItemModal from '@/components/modals/VisionItemModal.vue'
import type { Meta, VisionItem, WeeklyReview, Mood } from '@/types'
import { MOODS } from '@/types'

const store = useFluiserStore()
const t = useT()
const { today } = useToday()

type Tab = 'metas' | 'vision' | 'review'
const activeTab = ref<Tab>('metas')

const tabs = computed(() => [
  { id: 'metas',  label: t('Metas', 'Goals') },
  { id: 'vision', label: t('Vision Board', 'Vision Board') },
  { id: 'review', label: t('Revisión', 'Review') },
])

// ── Metas ──────────────────────────────────────────────────────────────
const editingMeta = ref<Meta | null>(null)
const isNewMeta = ref(false)

function openNewMeta() {
  editingMeta.value = {
    id: crypto.randomUUID(),
    title: '',
    tone: 'sky',
    icon: 'Brain',
    habitIds: [],
    status: 'active',
    createdAt: today.value,
  }
  isNewMeta.value = true
}

function openEditMeta(m: Meta) {
  editingMeta.value = { ...m, habitIds: [...m.habitIds] }
  isNewMeta.value = false
}

function metaProgress(m: Meta): number {
  if (!m.metric || m.metric.target === 0) return 0
  return Math.min(100, Math.round((m.metric.current / m.metric.target) * 100))
}

function statusTone(s: Meta['status']): string {
  return s === 'active' ? 'sky' : s === 'achieved' ? 'mint' : 'amber'
}

function statusLabel(s: Meta['status']): string {
  return s === 'active' ? t('Activa', 'Active') : s === 'achieved' ? t('Lograda', 'Achieved') : t('Pausada', 'Paused')
}

function daysLeft(deadline?: string): number | null {
  if (!deadline) return null
  return store.utils.daysBetween(new Date(), new Date(deadline + 'T00:00:00'))
}

// ── Vision Board ────────────────────────────────────────────────────────
const editingVision = ref<VisionItem | null>(null)
const isNewVision = ref(false)

function openNewVision() {
  editingVision.value = {
    id: crypto.randomUUID(),
    title: '',
    emoji: '✨',
    category: 'personal',
    tone: 'sky',
    createdAt: today.value,
  }
  isNewVision.value = true
}

function openEditVision(v: VisionItem) {
  editingVision.value = { ...v }
  isNewVision.value = false
}

// ── Weekly Review ───────────────────────────────────────────────────────
function getWeekKey(d: Date): string {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const n = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${date.getFullYear()}-W${String(n).padStart(2, '0')}`
}

const reviewDate = ref(new Date())
const reviewWeekKey = computed(() => getWeekKey(reviewDate.value))
const reviewWeekStart = computed(() => store.utils.startOfWeek(reviewDate.value))
const currentReview = computed(() => store.data.weeklyReviews[reviewWeekKey.value] ?? null)
const isCurrentOrPastWeek = computed(() => reviewWeekKey.value <= getWeekKey(new Date()))

function formatWeekLabel(start: Date): string {
  const end = store.utils.addDays(start, 6)
  const m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${start.getDate()} ${m[start.getMonth()]} – ${end.getDate()} ${m[end.getMonth()]}`
}

const reviewEditing = ref(false)
const reviewStep = ref(0)
const reviewWins = ref<string[]>([''])
const reviewChallenges = ref<string[]>([''])
const reviewGratitude = ref('')
const reviewFocus = ref('')
const reviewMood = ref<Mood>('good')

function startReview() {
  const r = currentReview.value
  reviewWins.value = r ? [...r.wins, ''] : ['']
  reviewChallenges.value = r ? [...r.challenges, ''] : ['']
  reviewGratitude.value = r?.gratitude ?? ''
  reviewFocus.value = r?.nextWeekFocus ?? ''
  reviewMood.value = r?.mood ?? 'good'
  reviewStep.value = 0
  reviewEditing.value = true
}

async function saveReview() {
  await store.saveWeeklyReview({
    weekKey: reviewWeekKey.value,
    wins: reviewWins.value.filter(w => w.trim()),
    challenges: reviewChallenges.value.filter(c => c.trim()),
    gratitude: reviewGratitude.value.trim(),
    nextWeekFocus: reviewFocus.value.trim(),
    mood: reviewMood.value,
    ts: Date.now(),
  })
  reviewEditing.value = false
}

const headerSub = computed(() => {
  if (activeTab.value === 'metas') return t(`${store.data.metas.length} metas`, `${store.data.metas.length} goals`)
  if (activeTab.value === 'vision') return t(`${store.data.visionItems.length} items`, `${store.data.visionItems.length} items`)
  return t('Revisión semanal', 'Weekly review')
})
</script>

<template>
  <div class="screen">
    <!-- Header -->
    <div class="screen-head">
      <div>
        <div class="screen-eyebrow">{{ t('Tu norte', 'Your north star') }}</div>
        <h1 class="screen-title">{{ t('Metas y Visión', 'Goals & Vision') }}</h1>
        <div class="screen-sub">{{ headerSub }}</div>
      </div>
      <button v-if="activeTab === 'metas'" class="btn btn-primary" @click="openNewMeta">
        <PlusIcon :size="13" /> {{ t('Nueva meta', 'New goal') }}
      </button>
      <button v-else-if="activeTab === 'vision'" class="btn btn-primary" @click="openNewVision">
        <PlusIcon :size="13" /> {{ t('Agregar', 'Add') }}
      </button>
    </div>

    <!-- Tab pills -->
    <div class="flex gap-1.5 flex-wrap mb-6">
      <button
        v-for="tab in tabs" :key="tab.id"
        class="pill cursor-pointer transition-colors px-3 py-1.5 font-medium"
        :class="activeTab === tab.id
          ? 'bg-bg-elevated text-text-1 border border-border-default'
          : 'bg-border-subtle text-text-2 border border-transparent hover:text-text-1'"
        @click="activeTab = tab.id as Tab"
      >{{ tab.label }}</button>
    </div>

    <!-- ── Tab: Metas ── -->
    <template v-if="activeTab === 'metas'">
      <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
        <div
          v-for="m in store.data.metas" :key="m.id"
          class="meta-card"
          :style="{ '--tone': `var(--${m.tone})`, '--tone-soft': `var(--${m.tone}-soft)` }"
          @click="openEditMeta(m)"
        >
          <div class="mc-header">
            <div class="mc-icon">
              <component :is="ICON_MAP[m.icon] ?? ICON_MAP.Brain" :size="17" />
            </div>
            <div class="mc-info">
              <div class="mc-title">{{ m.title }}</div>
              <div class="mc-chips">
                <span class="mc-chip" :style="{ background: `var(--${statusTone(m.status)}-soft)`, color: `var(--${statusTone(m.status)})` }">
                  {{ statusLabel(m.status) }}
                </span>
                <template v-if="m.deadline">
                  <span v-if="daysLeft(m.deadline) !== null && daysLeft(m.deadline)! >= 0" class="mc-chip">
                    {{ daysLeft(m.deadline) }}d
                  </span>
                  <span v-else class="mc-chip" style="background: var(--rose-soft); color: var(--rose)">
                    {{ t('Vencida', 'Overdue') }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <template v-if="m.metric">
            <div class="mc-metric-label">
              {{ m.metric.label }}: <strong>{{ m.metric.current }}</strong> / {{ m.metric.target }} {{ m.metric.unit }}
              <span class="mc-pct">{{ metaProgress(m) }}%</span>
            </div>
            <div class="mc-progress-track">
              <div class="mc-progress-fill" :style="{ width: metaProgress(m) + '%' }" />
            </div>
          </template>

          <div v-if="m.habitIds.length > 0" class="mc-habits">
            <template v-for="hId in m.habitIds" :key="hId">
              <span v-if="store.data.habits.find(h => h.id === hId)" class="mc-habit-chip">
                <component
                  :is="ICON_MAP[store.data.habits.find(h => h.id === hId)!.icon] ?? ICON_MAP.Habits"
                  :size="10"
                />
                {{ store.data.habits.find(h => h.id === hId)!.name }}
              </span>
            </template>
          </div>
        </div>

        <div v-if="store.data.metas.length === 0" key="__empty" class="py-12 text-center italic text-sm" style="color: var(--text-3)">
          {{ t('Sin metas todavía. Crea tu primera meta.', 'No goals yet. Create your first goal.') }}
        </div>
      </TransitionGroup>
    </template>

    <!-- ── Tab: Vision Board ── -->
    <template v-else-if="activeTab === 'vision'">
      <div class="vision-grid">
        <div
          v-for="v in store.data.visionItems" :key="v.id"
          class="vision-card"
          :style="{ '--tone': `var(--${v.tone})`, '--tone-soft': `var(--${v.tone}-soft)` }"
          @click="openEditVision(v)"
        >
          <div class="vc-emoji">{{ v.emoji }}</div>
          <div class="vc-title">{{ v.title }}</div>
          <div v-if="v.description" class="vc-desc">{{ v.description }}</div>
        </div>

        <div v-if="store.data.visionItems.length === 0" class="vision-empty">
          {{ t('Tu vision board está vacío.', 'Your vision board is empty.') }}
        </div>
      </div>
    </template>

    <!-- ── Tab: Revisión Semanal ── -->
    <template v-else>
      <!-- Week navigator -->
      <div class="week-nav">
        <button class="btn btn-ghost btn-sm" @click="reviewDate = store.utils.addDays(reviewDate, -7)">←</button>
        <div class="week-nav-label">
          <div class="week-key tnum">{{ reviewWeekKey }}</div>
          <div class="week-range">{{ formatWeekLabel(reviewWeekStart) }}</div>
        </div>
        <button
          class="btn btn-ghost btn-sm"
          :disabled="reviewWeekKey >= getWeekKey(new Date())"
          @click="reviewDate = store.utils.addDays(reviewDate, 7)"
        >→</button>
      </div>

      <!-- Summary view -->
      <template v-if="currentReview && !reviewEditing">
        <div class="review-summary">
          <div class="rs-row">
            <div class="rs-section">
              <div class="rs-label">{{ t('Logros', 'Wins') }}</div>
              <ul class="rs-list">
                <li v-for="(w, i) in currentReview.wins" :key="i">{{ w }}</li>
                <li v-if="!currentReview.wins.length" class="rs-empty">—</li>
              </ul>
            </div>
            <div class="rs-section">
              <div class="rs-label">{{ t('Desafíos', 'Challenges') }}</div>
              <ul class="rs-list">
                <li v-for="(c, i) in currentReview.challenges" :key="i">{{ c }}</li>
                <li v-if="!currentReview.challenges.length" class="rs-empty">—</li>
              </ul>
            </div>
          </div>
          <div class="rs-section">
            <div class="rs-label">{{ t('Gratitud', 'Gratitude') }}</div>
            <p class="rs-text">{{ currentReview.gratitude || '—' }}</p>
          </div>
          <div class="rs-section">
            <div class="rs-label">{{ t('Foco próxima semana', 'Next week focus') }}</div>
            <p class="rs-text">{{ currentReview.nextWeekFocus || '—' }}</p>
          </div>
          <div class="rs-section">
            <div class="rs-label">{{ t('Semana', 'Week') }}</div>
            <p class="rs-text">{{ MOODS.find(m => m.id === currentReview.mood)?.label ?? '—' }}</p>
          </div>
        </div>
        <button class="btn btn-ghost" style="margin-top: 12px" @click="startReview">
          {{ t('Editar revisión', 'Edit review') }}
        </button>
      </template>

      <!-- Empty state -->
      <template v-else-if="!currentReview && !reviewEditing">
        <div class="review-empty">
          <p>{{ t('No hay revisión para esta semana.', 'No review for this week.') }}</p>
          <button v-if="isCurrentOrPastWeek" class="btn btn-primary" @click="startReview">
            {{ t('Iniciar revisión', 'Start review') }}
          </button>
        </div>
      </template>

      <!-- Review stepper -->
      <template v-else-if="reviewEditing">
        <div class="review-form">
          <!-- Step 0: Wins -->
          <template v-if="reviewStep === 0">
            <div class="rf-step-title">{{ t('¿Cuáles fueron tus logros esta semana?', 'What were your wins this week?') }}</div>
            <div v-for="(_, i) in reviewWins" :key="i" class="rf-item-row">
              <input class="input" style="flex:1" :placeholder="t('Un logro…', 'A win…')" v-model="reviewWins[i]" />
              <button class="btn btn-ghost btn-sm" @click="reviewWins.splice(i, 1); if (!reviewWins.length) reviewWins.push('')">×</button>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:8px" @click="reviewWins.push('')">
              <PlusIcon :size="12" /> {{ t('Otro', 'Another') }}
            </button>
          </template>

          <!-- Step 1: Challenges -->
          <template v-else-if="reviewStep === 1">
            <div class="rf-step-title">{{ t('¿Qué te desafió esta semana?', 'What challenged you?') }}</div>
            <div v-for="(_, i) in reviewChallenges" :key="i" class="rf-item-row">
              <input class="input" style="flex:1" :placeholder="t('Un reto…', 'A challenge…')" v-model="reviewChallenges[i]" />
              <button class="btn btn-ghost btn-sm" @click="reviewChallenges.splice(i, 1); if (!reviewChallenges.length) reviewChallenges.push('')">×</button>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:8px" @click="reviewChallenges.push('')">
              <PlusIcon :size="12" /> {{ t('Otro', 'Another') }}
            </button>
          </template>

          <!-- Step 2: Gratitude -->
          <template v-else-if="reviewStep === 2">
            <div class="rf-step-title">{{ t('¿Por qué estás agradecido esta semana?', 'What are you grateful for?') }}</div>
            <textarea class="input" rows="4" :placeholder="t('Gratitud…', 'Gratitude…')" v-model="reviewGratitude" />
          </template>

          <!-- Step 3: Focus -->
          <template v-else-if="reviewStep === 3">
            <div class="rf-step-title">{{ t('¿Cuál es tu foco para la próxima semana?', 'What is your focus for next week?') }}</div>
            <textarea class="input" rows="4" :placeholder="t('Foco…', 'Focus…')" v-model="reviewFocus" />
          </template>

          <!-- Step 4: Mood -->
          <template v-else-if="reviewStep === 4">
            <div class="rf-step-title">{{ t('¿Cómo fue tu semana en general?', 'How was your week overall?') }}</div>
            <div class="rf-moods">
              <button
                v-for="m in MOODS" :key="m.id"
                class="rf-mood-btn"
                :class="reviewMood === m.id ? 'active' : ''"
                :style="reviewMood === m.id ? { background: `var(--${m.tone}-soft)`, color: `var(--${m.tone})`, borderColor: `var(--${m.tone})` } : {}"
                @click="reviewMood = m.id"
              >
                <span>{{ m.label }}</span>
                <span class="rf-mood-desc">{{ m.desc }}</span>
              </button>
            </div>
          </template>

          <!-- Navigation -->
          <div class="rf-nav">
            <button v-if="reviewStep > 0" class="btn btn-ghost" @click="reviewStep--">
              {{ t('Anterior', 'Previous') }}
            </button>
            <button v-else class="btn btn-ghost" @click="reviewEditing = false">
              {{ t('Cancelar', 'Cancel') }}
            </button>
            <div class="rf-dots">
              <div v-for="i in 5" :key="i" class="rf-dot" :class="reviewStep === i - 1 ? 'active' : ''" />
            </div>
            <button v-if="reviewStep < 4" class="btn btn-primary" @click="reviewStep++">
              {{ t('Siguiente', 'Next') }}
            </button>
            <button v-else class="btn btn-primary" @click="saveReview">
              {{ t('Guardar', 'Save') }}
            </button>
          </div>
        </div>
      </template>
    </template>

    <MetaEditorModal :meta="editingMeta" :isNew="isNewMeta" @close="editingMeta = null" />
    <VisionItemModal :item="editingVision" :isNew="isNewVision" @close="editingVision = null" />
  </div>
</template>

<style scoped>
/* ── Meta Card ── */
.meta-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--tone);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: background 160ms ease;
}
.meta-card:hover { background: var(--bg-elevated); }

.mc-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
.mc-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: grid; place-items: center; flex-shrink: 0;
  background: var(--tone-soft); color: var(--tone);
}
.mc-info { flex: 1; min-width: 0; }
.mc-title { font-size: 15px; font-weight: 600; color: var(--text-1); line-height: 1.3; }
.mc-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.mc-chip { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px; background: var(--bg-elevated); color: var(--text-3); }

.mc-metric-label { font-size: 12px; color: var(--text-3); margin-bottom: 6px; display: flex; gap: 6px; align-items: baseline; }
.mc-metric-label strong { color: var(--tone); }
.mc-pct { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--tone); font-variant-numeric: tabular-nums; }

.mc-progress-track { height: 4px; background: var(--border-subtle); border-radius: 99px; overflow: hidden; margin-bottom: 10px; }
.mc-progress-fill { height: 100%; background: var(--tone); border-radius: 99px; transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }

.mc-habits { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.mc-habit-chip {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--text-3);
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  padding: 2px 8px; border-radius: 999px;
}

/* ── Vision Board ── */
.vision-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.vision-empty { grid-column: 1 / -1; padding: 48px 0; text-align: center; font-style: italic; font-size: 14px; color: var(--text-3); }

.vision-card {
  background: var(--tone-soft);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 28px 16px 22px;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.vision-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.14); }

.vc-emoji { font-size: 42px; line-height: 1; margin-bottom: 4px; }
.vc-title { font-size: 14px; font-weight: 600; color: var(--text-1); line-height: 1.4; }
.vc-desc { font-size: 12px; color: var(--text-3); line-height: 1.5; }

/* ── Week Nav ── */
.week-nav {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-elevated); border-radius: 12px; padding: 12px 16px;
  margin-bottom: 20px;
}
.week-nav-label { flex: 1; text-align: center; }
.week-key { font-size: 11px; color: var(--text-3); margin-bottom: 2px; }
.week-range { font-size: 14px; font-weight: 600; color: var(--text-1); }

/* ── Review Summary ── */
.review-summary { display: flex; flex-direction: column; gap: 14px; background: var(--bg-elevated); border-radius: 16px; padding: 20px; }
.rs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.rs-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 8px; }
.rs-list { margin: 0; padding-left: 14px; display: flex; flex-direction: column; gap: 4px; }
.rs-list li { font-size: 14px; color: var(--text-1); }
.rs-empty { font-style: italic; color: var(--text-3); list-style: none; padding-left: 0; }
.rs-text { font-size: 14px; color: var(--text-1); margin: 0; }

/* ── Review Empty ── */
.review-empty { padding: 48px 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.review-empty p { font-size: 14px; color: var(--text-3); }

/* ── Review Form ── */
.review-form { background: var(--bg-elevated); border-radius: 16px; padding: 24px; }
.rf-step-title { font-size: 16px; font-weight: 600; color: var(--text-1); margin-bottom: 16px; line-height: 1.4; }
.rf-item-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.rf-moods { display: flex; flex-direction: column; gap: 8px; }
.rf-mood-btn {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-default);
  background: var(--bg-surface); cursor: pointer; transition: all 160ms ease;
  font-size: 14px; font-weight: 500; color: var(--text-2);
}
.rf-mood-btn.active { font-weight: 600; }
.rf-mood-btn:hover:not(.active) { border-color: var(--border-strong); color: var(--text-1); }
.rf-mood-desc { font-size: 12px; color: var(--text-3); font-weight: 400; }

.rf-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; }
.rf-dots { display: flex; gap: 6px; }
.rf-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border-default); transition: background 200ms; }
.rf-dot.active { background: var(--accent); }
</style>
