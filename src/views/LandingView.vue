<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { motion, animate } from 'motion-v'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useT } from '@/composables/useLang'
import {
  ArrowRightIcon, TimelineIcon, AnalyticsIcon, SparkleIcon,
  BookIcon, RunIcon, PauseIcon, CompassIcon, HeartIcon,
} from '@/components/icons/AppIcons'

gsap.registerPlugin(ScrollTrigger)

const auth = useAuthStore()
const { lang } = useTheme()
const t = useT()

const EASE = [0.16, 1, 0.3, 1] as const

/* ── Demo CTA ─────────────────────────────────────────────────────── */
const loadingDemo = ref(false)
async function tryDemo() {
  loadingDemo.value = true
  try { await auth.signInDemo() } finally { loadingDemo.value = false }
}

/* ── Scroll-aware nav ─────────────────────────────────────────────── */
const scrollEl = ref<HTMLElement | null>(null)
const scrolled = ref(false)
function onScroll() { scrolled.value = (scrollEl.value?.scrollTop ?? 0) > 8 }

/* ── Anchor nav (single-page scroll) ─────────────────────────────── */
function scrollToId(id: string) {
  if (id === 'top') { scrollEl.value?.scrollTo({ top: 0, behavior: 'smooth' }); return }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ── Semicircle / flattened-arc gauge dial (reused: hero + focus card) ── */
function useGaugeDial(opts: { rx: number; ry: number; cx: number; cy: number; maxS: number; targetS: number; ticks: number; tickLen: number }) {
  const { rx, ry, cx, cy, maxS, targetS, ticks, tickLen } = opts
  // Ramanujan's approximation for a half-ellipse arc length — only needs to be
  // self-consistent between dasharray/dashoffset, not geometrically exact.
  const h = ((rx - ry) ** 2) / ((rx + ry) ** 2)
  const circumference = (Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))) / 2
  const path = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy}`
  const seconds = ref(0)
  const display = computed(() => {
    const m = Math.floor(seconds.value / 60)
    const s = seconds.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })
  const fraction = computed(() => Math.min(1, seconds.value / maxS))
  const dashOffset = computed(() => circumference * (1 - fraction.value))
  const tipAngleRad = computed(() => (180 * (1 - fraction.value) * Math.PI) / 180)
  const tip = computed(() => ({
    x: cx + rx * Math.cos(tipAngleRad.value),
    y: cy - ry * Math.sin(tipAngleRad.value),
  }))
  const tickList = computed(() => Array.from({ length: ticks }, (_, i) => {
    const deg = 180 - i * (180 / (ticks - 1))
    const rad = (deg * Math.PI) / 180
    const major = i % 4 === 0
    const f = major ? tickLen / ry : (tickLen * 0.5) / ry
    const lit = i / (ticks - 1) <= fraction.value
    return {
      x1: cx + rx * Math.cos(rad), y1: cy - ry * Math.sin(rad),
      x2: cx + rx * (1 - f) * Math.cos(rad), y2: cy - ry * (1 - f) * Math.sin(rad),
      major, lit,
    }
  }))
  function play() {
    const state = { s: 0 }
    gsap.to(state, {
      s: targetS,
      duration: 2.4,
      ease: 'power3.out',
      onUpdate: () => { seconds.value = Math.round(state.s) },
    })
  }
  return reactive({ circumference, path, seconds, display, dashOffset, tip, ticks: tickList, play })
}

const heroGauge = useGaugeDial({ rx: 300, ry: 300, cx: 320, cy: 320, maxS: 50 * 60, targetS: 42 * 60 + 18, ticks: 25, tickLen: 26 })
const focusGauge = useGaugeDial({ rx: 85, ry: 85, cx: 100, cy: 100, maxS: 45 * 60, targetS: 17 * 60 + 28, ticks: 17, tickLen: 10 })

const focusCardRef = ref<HTMLElement | null>(null)
const heroTipRef = ref<SVGCircleElement | null>(null)
let focusIo: IntersectionObserver | null = null
let focusPlayed = false

/* ── Mock data for product-accurate previews ─────────────────────── */
const mockGoals = [
  { label: t('Correr 10K', 'Run a 10K'), value: 0.72, tone: 'sky' },
  { label: t('Leer 12 libros', 'Read 12 books'), value: 0.4, tone: 'lilac' },
]

const visionTiles = [
  { icon: CompassIcon, bg: 'var(--sky-soft)', fg: 'var(--accent)' },
  { icon: RunIcon, bg: 'var(--mint-soft)', fg: 'var(--mint)' },
  { icon: BookIcon, bg: 'var(--lilac-soft)', fg: 'var(--lilac)' },
  { icon: HeartIcon, bg: 'var(--amber-soft)', fg: 'var(--amber)' },
]

const heatCells = Array.from({ length: 98 }, (_, i) => {
  const v = (i * 37 + (i % 7) * 13) % 11
  return v < 3 ? 0 : v < 5 ? 1 : v < 7 ? 2 : v < 9 ? 3 : 4
})

const howSteps = [
  {
    title: t('Crea tus hábitos', 'Create your habits'),
    desc: t('Elige qué quieres construir y con qué frecuencia. Fluiser se adapta a tu ritmo.', 'Choose what you want to build and how often. Fluiser adapts to your pace.'),
  },
  {
    title: t('Entra en enfoque', 'Enter focus'),
    desc: t('Corre sesiones guiadas para tus tareas más importantes, sin distracciones.', 'Run guided sessions for your most important work, free of distractions.'),
  },
  {
    title: t('Revisa tu semana', 'Review your week'),
    desc: t('Cierra cada semana con una revisión guiada y ajusta tus metas.', 'Close every week with a guided review and adjust your goals.'),
  },
]

const extraCards = [
  {
    icon: TimelineIcon, tone: 'lilac',
    title: t('Flujo', 'Flow'),
    desc: t('Un diario de enfoque: registra tu ánimo y energía después de cada sesión.', 'A focus diary: log your mood and energy after every session.'),
  },
  {
    icon: AnalyticsIcon, tone: 'sky',
    title: t('Analytics', 'Analytics'),
    desc: t('Tu historia en números — tendencias y rachas de todo lo que has construido.', 'Your story in numbers — trends and streaks for everything you have built.'),
  },
  {
    icon: SparkleIcon, tone: 'amber',
    title: t('A tu medida', 'Made to fit'),
    desc: t('Bilingüe (ES/EN), modo claro y oscuro, e instalable como app.', 'Bilingual (ES/EN), light and dark mode, installable as an app.'),
  },
]

/* ── Stat count-up on view ───────────────────────────────────────── */
const statsRef = ref<HTMLElement | null>(null)
const statCategories = ref(0)
const statLangs = ref(0)
const statPrivate = ref(0)
let statsPlayed = false
let io: IntersectionObserver | null = null

function playStats() {
  if (statsPlayed) return
  statsPlayed = true
  animate(0, 5, { duration: 1.1, ease: EASE, onUpdate: (v: number) => { statCategories.value = Math.round(v) } })
  animate(0, 2, { duration: 0.7, ease: EASE, onUpdate: (v: number) => { statLangs.value = Math.round(v) } })
  animate(0, 100, { duration: 1.3, ease: EASE, onUpdate: (v: number) => { statPrivate.value = Math.round(v) } })
}

onMounted(() => {
  scrollEl.value?.addEventListener('scroll', onScroll, { passive: true })
  io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) playStats() }, { threshold: 0.5 })
  if (statsRef.value) io.observe(statsRef.value)
  focusIo = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !focusPlayed) { focusPlayed = true; focusGauge.play() }
  }, { threshold: 0.5 })
  if (focusCardRef.value) focusIo.observe(focusCardRef.value)
  setTimeout(heroGauge.play, 500)

  // GSAP: pulsing halo that rides the tip of the hero gauge
  if (heroTipRef.value) {
    gsap.to(heroTipRef.value, {
      scale: 1.8, opacity: 0.12, duration: 1.3, ease: 'sine.inOut',
      repeat: -1, yoyo: true, transformOrigin: '50% 50%',
    })
  }

  // GSAP + ScrollTrigger: staggered scroll-reveals across the rest of the page
  const scroller = scrollEl.value
  if (scroller) {
    gsap.from('.l-steps-grid .l-step', {
      opacity: 0, y: 30, duration: 0.7, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.l-steps-grid', scroller, start: 'top 85%' },
    })
    gsap.from('.l-features .l-feature-card', {
      opacity: 0, y: 44, scale: 0.97, duration: 0.8, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: '.l-features', scroller, start: 'top 85%' },
    })
    gsap.utils.toArray<HTMLElement>('.l-mock-goal-fill').forEach((el) => {
      const target = el.style.width
      gsap.fromTo(el, { width: '0%' }, {
        width: target, duration: 1.1, ease: 'power2.out',
        scrollTrigger: { trigger: el, scroller, start: 'top 90%' },
      })
    })
    gsap.utils.toArray<HTMLElement>('.l-mock-heat-grid').forEach((grid) => {
      gsap.from(grid.querySelectorAll('.hm-cell'), {
        opacity: 0, scale: 0.3, duration: 0.4, ease: 'back.out(2)', stagger: 0.008,
        scrollTrigger: { trigger: grid, scroller, start: 'top 88%' },
      })
    })
  }
})
onUnmounted(() => {
  scrollEl.value?.removeEventListener('scroll', onScroll)
  io?.disconnect()
  focusIo?.disconnect()
  if (heroTipRef.value) gsap.killTweensOf(heroTipRef.value)
  ScrollTrigger.getAll().forEach((st) => st.kill())
})
</script>

<template>
  <div class="landing-page">
    <svg class="l-noise" aria-hidden="true">
      <filter id="l-noise-f"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#l-noise-f)" />
    </svg>

    <div class="glow-red" aria-hidden="true" />
    <div class="glow-green" aria-hidden="true" />

    <!-- Nav -->
    <header class="l-nav" :class="{ scrolled }">
      <div class="l-nav-pill">
        <a href="#top" class="l-brand" @click.prevent="scrollToId('top')">
          <div class="l-brand-mark"><span>✦</span></div>
          <span class="l-brand-name">Fluiser</span>
        </a>
        <nav class="l-nav-links">
          <a href="#top" class="l-nav-link" @click.prevent="scrollToId('top')">{{ t('Inicio', 'Home') }}</a>
          <a href="#enfoque" class="l-nav-link" @click.prevent="scrollToId('enfoque')">{{ t('Enfoque', 'Focus') }}</a>
          <a href="#metas" class="l-nav-link" @click.prevent="scrollToId('metas')">{{ t('Metas', 'Goals') }}</a>
          <a href="#consistencia" class="l-nav-link" @click.prevent="scrollToId('consistencia')">{{ t('Consistencia', 'Consistency') }}</a>
        </nav>
        <div class="l-nav-actions">
          <button class="tc-btn tc-lang" @click="lang = lang === 'es' ? 'en' : 'es'">
            {{ lang === 'es' ? 'EN' : 'ES' }}
          </button>
          <motion.div :while-hover="{ scale: 1.04 }" :while-tap="{ scale: 0.96 }" :transition="{ duration: 0.15, ease: EASE }">
            <RouterLink to="/auth" class="l-nav-cta">{{ t('Iniciar sesión', 'Sign in') }}</RouterLink>
          </motion.div>
        </div>
      </div>
    </header>

    <main ref="scrollEl" class="l-scroll">
      <!-- Hero -->
      <section class="l-hero" id="top">
        <motion.div
          class="l-hero-frame"
          :initial="{ opacity: 0, scale: 0.96 }" :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.8, ease: EASE }"
        >
          <motion.div
            class="l-eyebrow"
            :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5, ease: EASE }"
          >{{ t('Hábitos con intención', 'Habits with intention') }}</motion.div>

          <h1 class="l-title">
            <motion.span
              class="l-title-line"
              :initial="{ opacity: 0, y: 28 }" :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.7, ease: EASE, delay: 0.08 }"
            >{{ t('Ruido fuera. Enfoque dentro.', 'Noise off. Focus on.') }}</motion.span>
            <motion.span
              class="l-title-line"
              :initial="{ opacity: 0, y: 28 }" :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.7, ease: EASE, delay: 0.18 }"
            >{{ t('Tus hábitos no esperan.', "Your habits don't wait.") }}</motion.span>
          </h1>

          <motion.p
            class="l-sub"
            :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, ease: EASE, delay: 0.32 }"
          >
            {{ t(
              'Fluiser conecta lo que haces cada día —tus hábitos, tu enfoque y tus metas— para que el progreso sea visible, no solo una intención.',
              'Fluiser connects what you do every day — your habits, your focus and your goals — so progress is visible, not just intended.',
            ) }}
          </motion.p>

          <motion.div
            class="l-cta-row"
            :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, ease: EASE, delay: 0.44 }"
          >
            <motion.div :while-hover="{ scale: 1.035 }" :while-tap="{ scale: 0.97 }" :transition="{ duration: 0.15, ease: EASE }">
              <RouterLink to="/auth" class="l-btn-primary">
                {{ t('Comenzar gratis', 'Get started free') }}
                <ArrowRightIcon :size="15" />
              </RouterLink>
            </motion.div>
            <motion.button
              class="l-btn-secondary" :class="{ loading: loadingDemo }" :disabled="loadingDemo"
              :while-hover="{ scale: 1.035 }" :while-tap="{ scale: 0.97 }" :transition="{ duration: 0.15, ease: EASE }"
              @click="tryDemo"
            >
              <span v-if="loadingDemo" class="l-spinner" />
              <span v-else>{{ t('Probar la demo', 'Try the demo') }}</span>
            </motion.button>
          </motion.div>

          <motion.div
            class="l-trust-row"
            :initial="{ opacity: 0 }" :animate="{ opacity: 1 }"
            :transition="{ duration: 0.6, ease: EASE, delay: 0.56 }"
          >
            <span>{{ t('Datos cifrados', 'Encrypted data') }}</span>
            <span class="l-trust-sep">·</span>
            <span>{{ t('Solo tuyos', 'Yours alone') }}</span>
            <span class="l-trust-sep">·</span>
            <span>{{ t('Sin anuncios', 'No ads') }}</span>
          </motion.div>

          <!-- Flow-time gauge — fills the bottom of the frame, cropped by its edge -->
          <motion.div
            class="l-gauge-wrap l-gauge-wrap-hero"
            :initial="{ opacity: 0, y: 24 }" :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.7, ease: EASE, delay: 0.5 }"
          >
            <svg class="l-gauge" viewBox="0 0 640 340" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
              <defs>
                <linearGradient id="l-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#5A99E8" />
                  <stop offset="55%" stop-color="#7BB6FF" />
                  <stop offset="100%" stop-color="#B8A8E0" />
                </linearGradient>
              </defs>
              <line
                v-for="(tk, i) in heroGauge.ticks" :key="i"
                :x1="tk.x1" :y1="tk.y1" :x2="tk.x2" :y2="tk.y2"
                class="l-gauge-tick" :class="{ major: tk.major, lit: tk.lit }"
              />
              <path class="l-gauge-track" :d="heroGauge.path" />
              <path
                class="l-gauge-fill" :d="heroGauge.path"
                :style="{ strokeDasharray: heroGauge.circumference, strokeDashoffset: heroGauge.dashOffset }"
              />
              <circle
                ref="heroTipRef" class="l-gauge-tip-halo"
                :cx="heroGauge.tip.x" :cy="heroGauge.tip.y" r="13"
              />
              <circle
                class="l-gauge-tip-dot"
                :cx="heroGauge.tip.x" :cy="heroGauge.tip.y" r="6"
              />
            </svg>
            <div class="l-gauge-center">
              <div class="l-gauge-label">{{ t('Tiempo en flujo', 'Flow time') }}</div>
              <div class="l-gauge-value tnum">{{ heroGauge.display }}</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <!-- How it works -->
      <section class="l-steps">
        <div class="l-steps-head">
          <div class="l-steps-eyebrow">{{ t('Cómo funciona', 'How it works') }}</div>
          <h2 class="l-steps-title">{{ t('Tres pasos, cada día.', 'Three steps, every day.') }}</h2>
        </div>
        <div class="l-steps-grid">
          <div v-for="(s, i) in howSteps" :key="s.title" class="l-step">
            <div class="l-step-num">{{ i + 1 }}</div>
            <h3 class="l-step-title">{{ s.title }}</h3>
            <p class="l-step-desc">{{ s.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Feature cards — Leflow-style: title+number, description, status pill, widget -->
      <section class="l-features">
        <article id="enfoque" ref="focusCardRef" class="l-feature-card">
          <div class="l-feature-glow-red" aria-hidden="true" /><div class="l-feature-glow-green" aria-hidden="true" />
          <div class="l-feature-head">
            <h3 class="l-feature-title">{{ t('Una sesión, sin ruido.', 'One session, no noise.') }}</h3>
            <span class="l-feature-num"><span class="dim">0</span>1</span>
          </div>
          <p class="l-feature-desc">
            {{ t(
              'Entra a modo enfoque de pantalla completa, corre el temporizador y deja que el resto espere. Al cerrar la sesión, registras cómo te sentiste.',
              'Enter full-screen focus mode, run the timer, and let everything else wait. When the session ends, you log how it felt.',
            ) }}
          </p>
          <div class="l-feature-widget">
            <div class="l-feature-pill"><span class="dot" />{{ t('Tiempo de flujo. Enfócate 45 min', 'Flow time. Be focused for 45 min') }}</div>
            <div class="l-feature-inner l-feature-inner-gauge">
              <svg class="l-gauge l-gauge-sm" viewBox="0 0 200 116" aria-hidden="true">
                <line
                  v-for="(tk, i) in focusGauge.ticks" :key="i"
                  :x1="tk.x1" :y1="tk.y1" :x2="tk.x2" :y2="tk.y2"
                  class="l-gauge-tick" :class="{ major: tk.major, lit: tk.lit }"
                />
                <path class="l-gauge-track" :d="focusGauge.path" />
                <path
                  class="l-gauge-fill" :d="focusGauge.path"
                  :style="{ strokeDasharray: focusGauge.circumference, strokeDashoffset: focusGauge.dashOffset }"
                />
              </svg>
              <div class="l-gauge-center l-gauge-center-sm">
                <div class="l-gauge-label">{{ t('Enfoque', 'Focus') }}</div>
                <div class="l-gauge-value tnum">{{ focusGauge.display }}</div>
              </div>
              <button class="l-mock-pill-btn l-feature-btn"><PauseIcon :size="12" /> {{ t('Pausar', 'Pause') }}</button>
            </div>
          </div>
        </article>

        <article id="metas" class="l-feature-card">
          <div class="l-feature-glow-red" aria-hidden="true" /><div class="l-feature-glow-green" aria-hidden="true" />
          <div class="l-feature-head">
            <h3 class="l-feature-title">{{ t('De la intención a la meta.', 'From intention to goal.') }}</h3>
            <span class="l-feature-num"><span class="dim">0</span>2</span>
          </div>
          <p class="l-feature-desc">
            {{ t(
              'Conecta tus hábitos a metas concretas, arma tu Vision Board y cierra cada semana con una revisión guiada.',
              'Connect your habits to concrete goals, build your Vision Board, and close every week with a guided review.',
            ) }}
          </p>
          <div class="l-feature-widget">
            <div class="l-feature-pill"><span class="dot" />{{ t('3 metas activas esta semana', '3 goals active this week') }}</div>
            <div class="l-feature-inner l-feature-inner-goals">
              <div v-for="g in mockGoals" :key="g.label" class="l-mock-goal">
                <div class="l-mock-goal-head">
                  <span>{{ g.label }}</span>
                  <span class="tnum">{{ Math.round(g.value * 100) }}%</span>
                </div>
                <div class="l-mock-goal-track">
                  <div class="l-mock-goal-fill" :style="{ width: `${g.value * 100}%`, background: `var(--${g.tone})` }" />
                </div>
              </div>
              <div class="l-mock-vision-grid">
                <div v-for="(v, i) in visionTiles" :key="i" class="l-mock-vision-tile" :style="{ background: v.bg }">
                  <component :is="v.icon" :size="16" :style="{ color: v.fg }" />
                </div>
              </div>
            </div>
          </div>
        </article>

        <article id="consistencia" class="l-feature-card">
          <div class="l-feature-glow-red" aria-hidden="true" /><div class="l-feature-glow-green" aria-hidden="true" />
          <div class="l-feature-head">
            <h3 class="l-feature-title">{{ t('Tu patrón, a la vista.', 'Your pattern, in view.') }}</h3>
            <span class="l-feature-num"><span class="dim">0</span>3</span>
          </div>
          <p class="l-feature-desc">
            {{ t(
              'Un mapa de calor de todo tu año, al estilo GitHub. Sin trucos: solo la verdad de cuánto apareciste.',
              'A GitHub-style heatmap of your whole year. No tricks — just the truth of how often you showed up.',
            ) }}
          </p>
          <div class="l-feature-widget">
            <div class="l-feature-pill"><span class="dot" />{{ t('12 días seguidos', '12-day streak') }}</div>
            <div class="l-feature-inner l-feature-inner-heat">
              <div class="l-mock-heat-grid">
                <div v-for="(lvl, i) in heatCells" :key="i" class="hm-cell" :data-l="lvl" />
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- Extra features -->
      <section class="l-extras-grid">
        <motion.div
          v-for="(c, i) in extraCards" :key="c.title"
          class="l-extra-card"
          :initial="{ opacity: 0, y: 20 }" :while-in-view="{ opacity: 1, y: 0 }" :viewport="{ once: true, amount: 0.4 }"
          :transition="{ duration: 0.5, ease: EASE, delay: i * 0.1 }"
        >
          <div class="l-extra-icon" :class="`bg-tone-${c.tone}`">
            <component :is="c.icon" :size="18" />
          </div>
          <h3 class="l-extra-title">{{ c.title }}</h3>
          <p class="l-extra-desc">{{ c.desc }}</p>
        </motion.div>
      </section>

      <!-- Stats -->
      <section ref="statsRef" class="l-stats">
        <div class="l-stat">
          <div class="l-stat-num tnum">{{ statCategories }}</div>
          <div class="l-stat-label">{{ t('categorías de hábitos', 'habit categories') }}</div>
        </div>
        <div class="l-stat">
          <div class="l-stat-num tnum">{{ statLangs }}</div>
          <div class="l-stat-label">{{ t('idiomas: ES / EN', 'languages: ES / EN') }}</div>
        </div>
        <div class="l-stat">
          <div class="l-stat-num tnum">{{ statPrivate }}%</div>
          <div class="l-stat-label">{{ t('tuyo. Sin anuncios.', 'yours. No ads.') }}</div>
        </div>
      </section>

      <!-- Final CTA -->
      <motion.section
        class="l-final-cta"
        :initial="{ opacity: 0, y: 24 }" :while-in-view="{ opacity: 1, y: 0 }" :viewport="{ once: true, amount: 0.5 }"
        :transition="{ duration: 0.6, ease: EASE }"
      >
        <h2 class="serif">{{ t('Empieza cuando quieras.', 'Start whenever you’re ready.') }}</h2>
        <p>{{ t('Sin tarjeta. Sin compromiso. Solo tú y tus hábitos.', 'No card. No commitment. Just you and your habits.') }}</p>
        <motion.div :while-hover="{ scale: 1.035 }" :while-tap="{ scale: 0.97 }" :transition="{ duration: 0.15, ease: EASE }">
          <RouterLink to="/auth" class="l-btn-primary">
            {{ t('Comenzar gratis', 'Get started free') }}
            <ArrowRightIcon :size="15" />
          </RouterLink>
        </motion.div>
      </motion.section>

      <footer class="l-footer">
        <div class="l-footer-word">FLUISER</div>
        <div class="l-footer-row">
          <span>© {{ new Date().getFullYear() }} Fluiser</span>
          <span class="l-trust-sep">·</span>
          <span>{{ t('Hecho con intención', 'Made with intention') }}</span>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.landing-page {
  position: absolute;
  inset: 0;
  background: var(--bg-base);
  font-family: var(--font-text);
  color: var(--text-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  --font-condensed: 'Anton', var(--font-display);
  --l-accent-1: var(--accent);
  --l-accent-2: var(--lilac);
}

.l-noise {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.025;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 3;
}

/* Ambient wash — fixed to the viewport so it stays consistent behind the nav
   and every section while scrolling, instead of cutting off at the hero edge. */
.glow-red, .glow-green {
  position: fixed;
  width: 720px; height: 720px;
  border-radius: 50%;
  filter: blur(130px);
  pointer-events: none;
  z-index: 0;
}
.glow-red   { top: -160px; left: -150px;  background: radial-gradient(circle, var(--l-accent-1) 0%, transparent 70%);   opacity: 0.4; }
.glow-green { top: -180px; right: -150px; background: radial-gradient(circle, var(--l-accent-2) 0%, transparent 70%); opacity: 0.3; }

/* Nav — floating pill, Leflow-style */
.l-nav {
  position: relative;
  z-index: 4;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px clamp(16px, 4vw, 40px) 18px;
}
.l-nav-pill {
  width: 100%;
  max-width: 860px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 9px 10px 9px 18px;
  background: transparent;
  border: none;
}
.l-brand { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.l-brand-mark {
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  display: grid; place-items: center;
  font-size: 11px;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 0 6px var(--l-accent-1);
}
.l-brand-name { font-family: var(--font-display); font-weight: 600; font-size: 14.5px; letter-spacing: -0.02em; }

.l-nav-links { display: flex; align-items: center; gap: 2px; margin: 0 auto; padding-left: 18px; }
.l-nav-link {
  padding: 7px 13px;
  border-radius: var(--r-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  white-space: nowrap;
  transition: background 160ms ease, color 160ms ease;
}
.l-nav-link:hover { color: var(--text-1); background: rgba(255,255,255,0.06); }

.l-nav-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.l-nav-cta {
  display: block;
  padding: 8px 18px;
  border-radius: var(--r-full);
  font-size: 13px;
  font-weight: 600;
  color: #0A0806;
  background: var(--text-1);
}

/* Scroll area */
.l-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-color: var(--border-strong) transparent;
}
.l-scroll::-webkit-scrollbar { width: 10px; }
.l-scroll::-webkit-scrollbar-track { background: transparent; }
.l-scroll::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
.l-scroll::-webkit-scrollbar-thumb:hover { background: var(--border-strong); background-clip: padding-box; border: 2px solid transparent; }

/* Hero — Leflow-style, fills the screen */
.l-hero {
  position: relative;
  margin: 0;
  min-height: calc(100vh - 116px);
  padding: 0;
  display: flex;
}

.l-hero-frame {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: clamp(20px, 4vh, 40px) clamp(20px, 5vw, 56px) 0;
  overflow: hidden;
}

.l-eyebrow {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--text-3); font-weight: 600; margin-bottom: 20px;
}
.l-title { margin: 0; }
.l-title-line {
  display: block;
  font-family: var(--font-condensed);
  font-size: clamp(30px, 5.4vw, 58px);
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.05;
  color: var(--text-1);
}
.l-sub {
  font-size: 15.5px;
  color: var(--text-2);
  max-width: 480px;
  margin: 22px auto 0;
  line-height: 1.6;
}

.l-cta-row { display: flex; justify-content: center; gap: 12px; margin-top: 30px; flex-wrap: wrap; }
.l-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 12px;
  background: #ffffff; color: #0A0B0D;
  font-size: 14.5px; font-weight: 600;
  box-shadow: 0 4px 24px var(--accent-glow), 0 1px 2px rgba(0,0,0,0.3);
}
.l-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-1);
  font-size: 14.5px; font-weight: 500;
}
.l-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.l-spinner {
  display: block;
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: var(--l-accent-1);
  border-radius: 50%;
  animation: l-spin 0.65s linear infinite;
}
@keyframes l-spin { to { transform: rotate(360deg); } }

.l-trust-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 24px; font-size: 11.5px; color: var(--text-3); }
.l-trust-sep { color: rgba(255,255,255,0.15); }

/* Flow-time gauge */
.l-gauge-wrap {
  position: relative;
  width: min(100%, 560px);
  margin-top: 44px;
}
.l-gauge { display: block; width: 100%; height: auto; overflow: visible; }
.l-gauge-track { fill: none; stroke: rgba(255, 255, 255, 0.08); stroke-width: 14; stroke-linecap: round; }
.l-gauge-fill {
  fill: none; stroke: url(#l-gauge-grad); stroke-width: 14; stroke-linecap: round;
  filter: drop-shadow(0 0 14px var(--accent-glow));
}
.l-gauge-tick { stroke: rgba(255, 255, 255, 0.16); stroke-width: 1.5; transition: stroke 300ms ease; }
.l-gauge-tick.major { stroke: rgba(255, 255, 255, 0.3); stroke-width: 2; }
.l-gauge-tick.lit { stroke: var(--accent); opacity: 0.9; }
.l-gauge-tick.lit.major { stroke: var(--mint); }
.l-gauge-tip-halo { fill: var(--accent); opacity: 0.35; filter: blur(1px); }
.l-gauge-tip-dot { fill: #ffffff; filter: drop-shadow(0 0 8px var(--accent)); }
.l-gauge-center {
  position: absolute;
  left: 50%; bottom: 4%;
  transform: translateX(-50%);
  text-align: center;
}
.l-gauge-label { font-size: 12px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
.l-gauge-value { font-family: var(--font-condensed); font-weight: 400; font-size: clamp(32px, 6vw, 52px); color: var(--text-1); letter-spacing: 0; }

/* Hero gauge — a true, moderately-sized circular dial, not a stretched ellipse */
.l-gauge-wrap-hero {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  width: min(92%, 640px);
  max-width: none;
  margin: 0 auto;
  pointer-events: none;
  z-index: 0;
}
.l-gauge-wrap-hero .l-gauge-center { bottom: 14%; }
.l-gauge-wrap-hero .l-gauge-value { font-size: clamp(32px, 4.4vw, 52px); }
.l-gauge-wrap-hero .l-gauge-fill { stroke-width: 16; }
.l-gauge-wrap-hero .l-gauge-track { stroke-width: 16; }

/* How it works */
.l-steps {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(48px, 8vh, 84px) 24px clamp(24px, 4vh, 40px);
}
.l-steps-head { text-align: center; margin-bottom: 40px; }
.l-steps-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); font-weight: 600; margin-bottom: 12px; }
.l-steps-title { font-family: var(--font-display); font-size: clamp(24px, 3vw, 32px); font-weight: 600; letter-spacing: -0.02em; margin: 0; }
.l-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.l-step { padding: 24px; border-radius: var(--r-lg); background: var(--bg-surface); border: 1px solid var(--border-subtle); box-shadow: var(--inner-hi), var(--shadow-sm); }
.l-step-num {
  width: 30px; height: 30px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--accent-soft); color: var(--accent);
  font-family: var(--font-display); font-weight: 600; font-size: 13px;
  margin-bottom: 16px;
}
.l-step-title { font-size: 16px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
.l-step-desc { font-size: 13.5px; color: var(--text-2); line-height: 1.55; margin: 0; }

/* Feature cards — Leflow-style numbered cards with dot-grid + red/green edge glow */
.l-features {
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(32px, 6vh, 64px) 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.l-feature-card {
  position: relative;
  padding: clamp(22px, 4vw, 32px) clamp(20px, 4vw, 32px);
  border-radius: 22px;
  background:
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 1px) 0 0 / 15px 15px,
    linear-gradient(180deg, rgba(16, 14, 20, 0.85) 0%, rgba(6, 5, 8, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px -24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
}
.l-feature-card::before {
  content: '';
  position: absolute;
  top: 0; left: 6%; right: 6%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--l-accent-1) 30%, var(--l-accent-2) 70%, transparent);
  opacity: 0.6;
}
.l-feature-glow-red, .l-feature-glow-green {
  position: absolute;
  width: 320px; height: 320px;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.l-feature-glow-red   { top: -140px; left: -80px;  background: radial-gradient(circle, var(--l-accent-1) 0%, transparent 70%);   opacity: 0.4; }
.l-feature-glow-green { top: -140px; right: -80px; background: radial-gradient(circle, var(--l-accent-2) 0%, transparent 70%); opacity: 0.3; }

.l-feature-head { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.l-feature-title { font-size: clamp(19px, 2.4vw, 24px); font-weight: 600; letter-spacing: -0.015em; margin: 0; color: var(--text-1); }
.l-feature-num { font-family: var(--font-condensed); font-size: 28px; color: var(--text-3); flex-shrink: 0; }
.l-feature-num .dim { opacity: 0.4; }
.l-feature-desc { position: relative; z-index: 1; font-size: 14.5px; color: var(--text-2); line-height: 1.6; max-width: 460px; margin: 12px 0 0; }

.l-feature-widget { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; margin-top: 28px; }
.l-feature-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 16px; border-radius: 999px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  font-size: 12.5px; color: var(--text-2); margin-bottom: -14px; z-index: 1;
}
.l-feature-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--l-accent-1); flex-shrink: 0; }
.l-feature-inner {
  width: min(100%, 420px);
  padding: 30px 24px 22px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.l-feature-inner-gauge { position: relative; padding-top: 34px; }
.l-gauge-sm { width: 200px; }
.l-gauge-center-sm { bottom: 26%; }
.l-mock-pill-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px;
  border-radius: 999px;
  background: var(--amber); color: #0A0B0D;
  font-size: 13px; font-weight: 600;
  border: none;
  box-shadow: 0 4px 16px var(--amber-soft);
}
.l-feature-inner-goals { align-items: stretch; gap: 16px; }
.l-mock-goal { display: flex; flex-direction: column; gap: 8px; }
.l-mock-goal-head { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-2); font-weight: 500; }
.l-mock-goal-track { height: 6px; border-radius: 999px; background: var(--border-subtle); overflow: hidden; }
.l-mock-goal-fill { height: 100%; border-radius: 999px; }
.l-mock-vision-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px; width: 100%; }
.l-mock-vision-tile { aspect-ratio: 1; border-radius: 10px; display: grid; place-items: center; }

.l-mock-heat-grid { display: grid; grid-template-columns: repeat(14, 12px); gap: 3px; }

/* Extra features */
.l-extras-grid {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 24px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
.l-extra-card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--r-lg); padding: 22px; box-shadow: var(--inner-hi), var(--shadow-sm); }
.l-extra-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px; }
.l-extra-title { font-size: 15px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.01em; }
.l-extra-desc { font-size: 13px; color: var(--text-2); line-height: 1.55; margin: 0; }

/* Stats */
.l-stats {
  max-width: 900px;
  margin: 40px auto 0;
  padding: 40px 24px;
  border-top: 1px solid var(--border-subtle);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  text-align: center;
}
.l-stat-num { font-family: var(--font-display); font-size: clamp(32px, 4vw, 44px); font-weight: 600; letter-spacing: -0.03em; color: var(--text-1); }
.l-stat-label { font-size: 12.5px; color: var(--text-3); margin-top: 6px; }

/* Final CTA */
.l-final-cta {
  max-width: 560px;
  margin: 0 auto;
  padding: 56px 24px 72px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.l-final-cta h2 {
  font-size: clamp(26px, 3.6vw, 36px);
  font-weight: 500;
  font-style: italic;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}
.l-final-cta p { font-size: 14.5px; color: var(--text-2); margin: 0 0 28px; }

/* Footer */
.l-footer { position: relative; padding: 20px 24px 32px; text-align: center; overflow: hidden; }
.l-footer-word {
  font-family: var(--font-display);
  font-size: clamp(64px, 14vw, 160px);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--text-1);
  opacity: 0.04;
  line-height: 1;
  user-select: none;
  pointer-events: none;
}
.l-footer-row { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: var(--text-3); margin-top: -8px; }

/* Responsive */
@media (max-width: 640px) {
  .l-feature-head { flex-direction: column; gap: 4px; }
  .l-feature-num { align-self: flex-end; margin-top: -28px; }
  .l-steps-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .l-nav-links { display: none; }
  .l-nav-pill { justify-content: space-between; }
}
</style>
