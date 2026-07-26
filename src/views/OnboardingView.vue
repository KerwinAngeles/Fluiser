<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { CATEGORIES, SUGGESTED } from '@/types'
import { ICON_MAP, ArrowRightIcon, CheckIcon } from '@/components/icons/AppIcons'
import type { CategoryId, SuggestedHabit } from '@/types'

const store = useFluiserStore()
const t = useT()

const TOTAL_STEPS = 6

const step = ref(0)
const name = ref('')
const timeOfDay = ref<'morning' | 'afternoon' | 'evening' | null>(null)
const mainGoal = ref<string | null>(null)
const selectedCategory = ref<CategoryId | null>(null)
const selectedHabitIds = ref<Set<string>>(new Set())

const STEPS_MAP = [
  { label: t('Nombre', 'Name') },
  { label: t('Ritmo', 'Schedule') },
  { label: t('Meta', 'Goal') },
  { label: t('Área', 'Area') },
  { label: t('Hábitos', 'Habits') },
  { label: t('¡Listo!', 'Done!') },
]

const TIME_OPTIONS = [
  { id: 'morning'   as const, label: t('Mañana', 'Morning'),   emoji: '🌅', range: '6am – 12pm', defaultTime: '07:00' },
  { id: 'afternoon' as const, label: t('Tarde',  'Afternoon'), emoji: '☀️', range: '12pm – 6pm', defaultTime: '15:00' },
  { id: 'evening'   as const, label: t('Noche',  'Evening'),   emoji: '🌙', range: '6pm – 12am', defaultTime: '20:00' },
]

const GOALS = [
  { id: 'consistency', label: t('Ser consistente',  'Stay consistent'),   emoji: '🔄', desc: t('Mantener un ritmo diario',      'Keep a daily rhythm')    },
  { id: 'health',      label: t('Mejorar mi salud', 'Improve my health'), emoji: '💚', desc: t('Cuerpo y mente en forma',       'Body and mind in shape') },
  { id: 'focus',       label: t('Ganar foco',       'Gain focus'),        emoji: '🎯', desc: t('Menos distracciones',           'Less distraction')       },
  { id: 'rest',        label: t('Descansar mejor',  'Rest better'),       emoji: '🌙', desc: t('Recuperación y sueño real',    'Real rest and recovery') },
]

const suggested = computed<SuggestedHabit[]>(() =>
  selectedCategory.value ? SUGGESTED[selectedCategory.value] ?? [] : []
)

function toggleSuggested(id: string) {
  const s = new Set(selectedHabitIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedHabitIds.value = s
}

const isSkippable = computed(() => step.value === 1 || step.value === 2)

function next() { if (step.value < TOTAL_STEPS - 1) step.value++ }
function back() { if (step.value > 0) step.value-- }

async function finish() {
  if (selectedCategory.value) {
    const prefTime = TIME_OPTIONS.find(o => o.id === timeOfDay.value)?.defaultTime
    for (const h of suggested.value.filter(h => selectedHabitIds.value.has(h.id))) {
      await store.upsertHabit({
        id: h.id, name: h.name, category: selectedCategory.value,
        icon: h.icon, tone: h.tone,
        time: prefTime ?? h.time,
        freq: h.freq,
        timer: { enabled: false, duration: 25, sessions: 4, breakDuration: 5 },
        createdAt: new Date().toISOString(),
      })
    }
  }
  await store.writeSettings({ name: name.value || t('Amigo', 'Friend'), onboarded: true })
}

const canContinue = computed(() => {
  if (step.value === 0) return name.value.trim().length > 0
  if (step.value === 3) return selectedCategory.value !== null
  if (step.value === 4) return selectedHabitIds.value.size > 0
  return true
})
</script>

<template>
  <div class="fixed inset-0 bg-bg-base flex flex-col items-center z-[60] overflow-hidden">
    <div class="ambient" />

    <div class="relative z-10 w-full max-w-[640px] px-8 flex flex-col" style="height: 100dvh; min-height: 100vh;">

      <!-- ── Scrollable step content ── -->
      <div class="flex-1 overflow-y-auto step-scroll">
        <Transition name="slide" mode="out-in">

          <!-- Step 0 · Name -->
          <div v-if="step === 0" key="s0" class="pt-2 pb-6">
            <div class="screen-eyebrow text-center mb-3">{{ t('Bienvenido a', 'Welcome to') }}</div>
            <h1
              class="text-[44px] font-extrabold tracking-tighter text-center mb-3 leading-none"
              style="background: linear-gradient(135deg, var(--accent), var(--lilac)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
            >Fluiser</h1>
            <p class="text-text-2 text-center text-[15px] mb-10 leading-relaxed max-w-sm mx-auto">
              {{ t('Un espacio íntimo para vivir tus hábitos con intención.', 'An intimate space to live your habits with intention.') }}
            </p>
            <label class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3 mb-2.5">
              {{ t('¿Cómo te llamas?', "What's your name?") }}
            </label>
            <input
              class="input text-[17px] py-4 px-[18px]"
              type="text"
              :placeholder="t('Tu nombre', 'Your name')"
              v-model="name"
              autofocus
              @keyup.enter="canContinue && next()"
            />
          </div>

          <!-- Step 1 · Time of day -->
          <div v-else-if="step === 1" key="s1" class="pt-6 pb-6">
            <div class="screen-eyebrow text-center mb-3">{{ t('Hola', 'Hey') }}, {{ name || t('amigo', 'friend') }} 👋</div>
            <h2 class="text-[26px] font-bold tracking-tight text-center mb-2">
              {{ t('¿Cuándo tienes más energía?', 'When do you have the most energy?') }}
            </h2>
            <p class="text-text-3 text-center text-[13px] mb-10 leading-relaxed">
              {{ t('Usaremos esto para programar tus hábitos en el mejor momento.', "We'll use this to schedule your habits at the right time.") }}
            </p>
            <div class="flex flex-col gap-5">
              <button
                v-for="opt in TIME_OPTIONS" :key="opt.id"
                class="flex items-center gap-5 py-7 px-6 rounded-2xl border text-left transition-all duration-200"
                :style="timeOfDay === opt.id
                  ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)' }
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }"
                @click="timeOfDay = opt.id"
              >
                <span class="text-4xl shrink-0">{{ opt.emoji }}</span>
                <div class="flex-1">
                  <div class="text-[17px] font-semibold text-text-1">{{ opt.label }}</div>
                  <div class="text-[13px] text-text-3 mt-1">{{ opt.range }}</div>
                </div>
                <div
                  class="w-5 h-5 rounded-full grid place-items-center shrink-0 transition-all duration-200"
                  :style="timeOfDay === opt.id
                    ? { background: 'var(--accent)' }
                    : { background: 'var(--bg-elevated)', border: '1.5px solid var(--border-default)' }"
                >
                  <CheckIcon v-if="timeOfDay === opt.id" :size="11" style="color: var(--bg-base)" />
                </div>
              </button>
            </div>
          </div>

          <!-- Step 2 · Main goal -->
          <div v-else-if="step === 2" key="s2" class="pt-6 pb-6">
            <div class="screen-eyebrow text-center mb-3">{{ t('Perfecto', 'Perfect') }}</div>
            <h2 class="text-[26px] font-bold tracking-tight text-center mb-2">
              {{ t('¿Qué quieres lograr?', 'What do you want to achieve?') }}
            </h2>
            <p class="text-text-3 text-center text-[13px] mb-10 leading-relaxed">
              {{ t('Elige tu enfoque principal por ahora. Puedes cambiar esto después.', 'Choose your main focus for now. You can always change it later.') }}
            </p>
            <div class="grid grid-cols-2 gap-5">
              <button
                v-for="goal in GOALS" :key="goal.id"
                class="flex flex-col items-start gap-5 p-7 rounded-2xl border text-left transition-all duration-200"
                :style="mainGoal === goal.id
                  ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)' }
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }"
                @click="mainGoal = goal.id"
              >
                <span class="text-3xl">{{ goal.emoji }}</span>
                <div>
                  <div class="text-[15px] font-semibold text-text-1 leading-snug">{{ goal.label }}</div>
                  <div class="text-[12px] text-text-3 mt-1.5 leading-relaxed">{{ goal.desc }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Step 3 · Category -->
          <div v-else-if="step === 3" key="s3" class="pt-6 pb-6">
            <div class="screen-eyebrow text-center mb-3">{{ t('Casi ahí', 'Almost there') }}</div>
            <h2 class="text-[26px] font-bold tracking-tight text-center mb-2">
              {{ t('¿En qué área quieres crecer?', 'Where do you want to grow?') }}
            </h2>
            <p class="text-text-3 text-center text-[13px] mb-10">
              {{ t('Puedes agregar más categorías después.', 'You can add more categories later.') }}
            </p>
            <div class="flex flex-col gap-5">
              <button
                v-for="cat in CATEGORIES" :key="cat.id"
                class="flex items-center gap-5 py-6 px-6 rounded-2xl border text-left transition-all duration-200"
                :style="selectedCategory === cat.id
                  ? { background: `var(--${cat.tone}-soft)`, borderColor: `var(--${cat.tone})` }
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }"
                @click="selectedCategory = cat.id"
              >
                <div
                  class="rounded-xl grid place-items-center shrink-0"
                  style="width: 52px; height: 52px;"
                  :style="{ background: `var(--${cat.tone}-soft)`, color: `var(--${cat.tone})` }"
                >
                  <component :is="ICON_MAP[cat.icon] ?? ICON_MAP.Habits" :size="24" />
                </div>
                <div class="flex-1">
                  <div class="text-[16px] font-semibold text-text-1">{{ cat.label }}</div>
                  <div class="text-[13px] text-text-3 mt-1">{{ cat.desc }}</div>
                </div>
                <div
                  class="w-5 h-5 rounded-full grid place-items-center shrink-0 transition-all duration-200"
                  :style="selectedCategory === cat.id
                    ? { background: `var(--${cat.tone})` }
                    : { background: 'var(--bg-elevated)', border: '1.5px solid var(--border-default)' }"
                >
                  <CheckIcon v-if="selectedCategory === cat.id" :size="11" style="color: #fff" />
                </div>
              </button>
            </div>
          </div>

          <!-- Step 4 · Suggested habits -->
          <div v-else-if="step === 4" key="s4" class="pt-6 pb-6">
            <div class="screen-eyebrow text-center mb-3">{{ t('Hábitos sugeridos', 'Suggested habits') }}</div>
            <h2 class="text-[26px] font-bold tracking-tight text-center mb-2">
              {{ t('¿Cuáles te resuenan?', 'Which ones resonate?') }}
            </h2>
            <p class="text-text-3 text-center text-[13px] mb-10">
              {{ t('Selecciona al menos uno para empezar.', 'Pick at least one to start.') }}
            </p>
            <div class="flex flex-col gap-5">
              <button
                v-for="h in suggested" :key="h.id"
                class="flex items-center gap-5 py-6 px-6 rounded-2xl border text-left transition-all duration-200"
                :style="selectedHabitIds.has(h.id)
                  ? { background: `var(--${h.tone}-soft)`, borderColor: `var(--${h.tone})` }
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }"
                @click="toggleSuggested(h.id)"
              >
                <div
                  class="rounded-2xl grid place-items-center shrink-0"
                  style="width: 56px; height: 56px;"
                  :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }"
                >
                  <component :is="ICON_MAP[h.icon] ?? ICON_MAP.Habits" :size="26" />
                </div>
                <div class="flex-1">
                  <div class="text-[16px] font-semibold text-text-1">{{ h.name }}</div>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span
                      class="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }"
                    >
                      {{ h.freq === 'daily' ? t('Diario', 'Daily')
                        : h.freq === 'mon,tue,wed,thu,fri' ? t('Lun–Vie', 'Mon–Fri')
                        : h.freq === 'mon,wed,fri' ? t('3× sem', '3× week')
                        : h.freq }}
                    </span>
                    <span class="text-[11px]" style="color: var(--text-4)">{{ h.time }}</span>
                  </div>
                </div>
                <div
                  class="w-6 h-6 rounded-full grid place-items-center shrink-0 transition-all duration-200"
                  :style="selectedHabitIds.has(h.id)
                    ? { background: `var(--${h.tone})` }
                    : { background: 'var(--bg-elevated)', border: '1.5px solid var(--border-default)' }"
                >
                  <CheckIcon v-if="selectedHabitIds.has(h.id)" :size="12" style="color: #fff" />
                </div>
              </button>
            </div>
          </div>

          <!-- Step 5 · All set -->
          <div v-else key="s5" class="text-center pt-8 pb-6">
            <div
              class="w-24 h-24 rounded-full mx-auto mb-8 grid place-items-center text-[44px]"
              style="background: linear-gradient(135deg, var(--accent), var(--lilac)); box-shadow: 0 0 48px var(--accent-glow);"
            >✦</div>
            <h2 class="text-[30px] font-extrabold tracking-tighter mb-3">
              {{ t('Todo listo,', 'All set,') }} {{ name || t('amigo', 'friend') }} ✨
            </h2>
            <p class="text-text-2 text-[15px] leading-relaxed mb-10 max-w-[340px] mx-auto">
              {{ t('Tu espacio de hábitos está listo. Cada día es una nueva oportunidad.', "Your habit space is ready. Every day is a fresh start.") }}
            </p>
            <div class="flex flex-col gap-3.5 max-w-[280px] mx-auto text-left">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full grid place-items-center text-sm shrink-0" style="background: var(--mint-soft); color: var(--mint)">✓</div>
                <span class="text-[13px] text-text-2">{{ t('Datos 100% privados', '100% private data') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full grid place-items-center text-sm shrink-0" style="background: var(--accent-soft); color: var(--accent)">✓</div>
                <span class="text-[13px] text-text-2">{{ t('Modo oscuro premium', 'Premium dark mode') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full grid place-items-center text-sm shrink-0" style="background: var(--lilac-soft); color: var(--lilac)">✓</div>
                <span class="text-[13px] text-text-2">{{ t('Hábitos listos para empezar', 'Habits ready to track') }}</span>
              </div>
            </div>
          </div>

        </Transition>
      </div>

      <!-- ── Navigation ── -->
      <div class="shrink-0 pt-3 pb-8">
        <div
          class="flex items-center gap-3"
          :class="step === 0 ? 'justify-end' : 'justify-between'"
        >
          <button v-if="step > 0" class="btn btn-ghost" @click="back">{{ t('Atrás', 'Back') }}</button>
          <div class="flex items-center gap-2">
            <button
              v-if="isSkippable"
              class="text-[13px] px-3 py-2 rounded-xl transition-colors"
              style="color: var(--text-3)"
              @click="next"
            >{{ t('Saltar', 'Skip') }}</button>
            <button
              v-if="step < TOTAL_STEPS - 1"
              class="btn btn-primary min-w-[140px] gap-2 transition-opacity"
              :class="canContinue ? '' : 'opacity-40'"
              :disabled="!canContinue"
              @click="next"
            >{{ t('Continuar', 'Continue') }} <ArrowRightIcon :size="14" /></button>
            <button
              v-else
              class="btn btn-primary min-w-[180px] text-[15px] py-3.5 gap-2"
              @click="finish"
            >{{ t('Empezar', "Let's go") }} <ArrowRightIcon :size="14" /></button>
          </div>
        </div>
        <p v-if="isSkippable" class="text-center text-[11px] mt-3" style="color: var(--text-4)">
          {{ t('Opcional · puedes completarlo más tarde', 'Optional · you can fill this in later') }}
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.step-scroll { overscroll-behavior: contain; scrollbar-width: none; }
.step-scroll::-webkit-scrollbar { display: none; }

.slide-enter-active,
.slide-leave-active { transition: opacity 180ms ease, transform 200ms cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from { opacity: 0; transform: translateX(22px); }
.slide-leave-to  { opacity: 0; transform: translateX(-22px); }
</style>
