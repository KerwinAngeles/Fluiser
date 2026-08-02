<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'motion-v'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useT } from '@/composables/useLang'
import {
  SunIcon, MoonIcon, ArrowRightIcon, TimelineIcon, AnalyticsIcon, SparkleIcon,
  LeafIcon, BookIcon, RunIcon, PauseIcon, CompassIcon, HeartIcon,
} from '@/components/icons/AppIcons'

const auth = useAuthStore()
const { lang, dark } = useTheme()
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

/* ── Hero tilt (mouse-driven, spring-smoothed) ───────────────────── */
const mx = useMotionValue(0)
const my = useMotionValue(0)
const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 160, damping: 22 })
const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 22 })
function onHeroMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  mx.set((e.clientX - r.left) / r.width - 0.5)
  my.set((e.clientY - r.top) / r.height - 0.5)
}
function onHeroLeave() { mx.set(0); my.set(0) }

/* ── Mock data for product-accurate previews ─────────────────────── */
const mockHabits = [
  { name: t('Meditar 10 min', 'Meditate 10 min'), icon: LeafIcon, tone: 'mint', done: true, cat: t('Mente', 'Mind') },
  { name: t('Leer 20 páginas', 'Read 20 pages'), icon: BookIcon, tone: 'lilac', done: true, cat: t('Mente', 'Mind') },
  { name: t('Entrenar', 'Train'), icon: RunIcon, tone: 'amber', done: false, cat: t('Cuerpo', 'Body') },
]

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
})
onUnmounted(() => {
  scrollEl.value?.removeEventListener('scroll', onScroll)
  io?.disconnect()
})
</script>

<template>
  <div class="landing-page">
    <svg class="l-noise" aria-hidden="true">
      <filter id="l-noise-f"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#l-noise-f)" />
    </svg>

    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <!-- Nav -->
    <header class="l-nav" :class="{ scrolled }">
      <div class="l-brand">
        <div class="l-brand-mark"><span>✦</span></div>
        <span class="l-brand-name">Fluiser</span>
      </div>
      <div class="l-nav-actions">
        <button class="tc-btn" :title="dark ? t('Modo claro', 'Light mode') : t('Modo oscuro', 'Dark mode')" @click="dark = !dark">
          <SunIcon v-if="dark" :size="16" />
          <MoonIcon v-else :size="16" />
        </button>
        <button class="tc-btn tc-lang" @click="lang = lang === 'es' ? 'en' : 'es'">
          {{ lang === 'es' ? 'EN' : 'ES' }}
        </button>
        <motion.div :while-hover="{ scale: 1.04 }" :while-tap="{ scale: 0.96 }" :transition="{ duration: 0.15, ease: EASE }">
          <RouterLink to="/auth" class="l-login-btn">{{ t('Iniciar sesión', 'Sign in') }}</RouterLink>
        </motion.div>
      </div>
    </header>

    <main ref="scrollEl" class="l-scroll">
      <!-- Hero -->
      <section class="l-hero">
        <div class="l-hero-copy">
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
            >{{ t('Construye hábitos', 'Build habits') }}</motion.span>
            <motion.span
              class="l-title-line l-title-accent"
              :initial="{ opacity: 0, y: 28 }" :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.7, ease: EASE, delay: 0.18 }"
            >{{ t('que de verdad se quedan.', 'that actually stick.') }}</motion.span>
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
        </div>

        <!-- Floating product preview -->
        <motion.div
          class="l-hero-visual"
          :initial="{ opacity: 0, scale: 0.92, rotate: -2 }" :animate="{ opacity: 1, scale: 1, rotate: 0 }"
          :transition="{ duration: 0.8, ease: EASE, delay: 0.2 }"
        >
          <motion.div
            class="l-mock-card"
            :style="{ rotateX, rotateY, transformPerspective: 1400 }"
            @mousemove="onHeroMove" @mouseleave="onHeroLeave"
          >
            <div class="l-mock-nav">
              <div class="l-mock-brand"><span>✦</span> Fluiser</div>
              <div class="l-mock-date">{{ t('Hoy', 'Today') }}</div>
            </div>
            <div class="l-mock-body">
              <div class="l-mock-ring-row">
                <div class="ring-wrap" style="width:72px;height:72px">
                  <svg width="72" height="72" style="transform:rotate(-90deg)">
                    <circle cx="36" cy="36" r="30" stroke-width="6" fill="none" stroke="var(--border-default)" />
                    <circle cx="36" cy="36" r="30" stroke-width="6" fill="none" stroke="var(--accent)" stroke-linecap="round"
                      stroke-dasharray="188.5" stroke-dashoffset="60" />
                  </svg>
                  <div class="ring-text">
                    <div style="font-family:var(--font-display);font-weight:600;font-size:18px;letter-spacing:-0.02em">68%</div>
                  </div>
                </div>
                <div class="l-mock-streak">
                  <div class="l-mock-streak-num">12</div>
                  <div class="l-mock-streak-label">{{ t('días seguidos', 'day streak') }}</div>
                </div>
              </div>
              <div class="l-mock-habits">
                <div v-for="h in mockHabits" :key="h.name" class="l-mock-habit">
                  <span :class="['h-check', h.done ? 'done' : '']"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
                  <span class="l-mock-habit-icon" :style="{ background: `var(--${h.tone}-soft)`, color: `var(--${h.tone})` }">
                    <component :is="h.icon" :size="14" />
                  </span>
                  <span class="l-mock-habit-text" :class="{ done: h.done }">{{ h.name }}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <!-- Marquee -->
      <div class="l-marquee">
        <div class="l-marquee-track">
          <span v-for="n in 2" :key="n" class="l-marquee-set">
            <span>{{ t('Hábitos', 'Habits') }}</span><span class="l-marquee-dot">✦</span>
            <span>{{ t('Enfoque', 'Focus') }}</span><span class="l-marquee-dot">✦</span>
            <span>{{ t('Metas y Visión', 'Goals & Vision') }}</span><span class="l-marquee-dot">✦</span>
            <span>{{ t('Consistencia', 'Consistency') }}</span><span class="l-marquee-dot">✦</span>
            <span>{{ t('Flujo', 'Flow') }}</span><span class="l-marquee-dot">✦</span>
            <span>Analytics</span><span class="l-marquee-dot">✦</span>
          </span>
        </div>
      </div>

      <!-- Showcase: Enfoque -->
      <section class="l-showcase">
        <motion.div
          class="l-showcase-copy"
          :initial="{ opacity: 0, x: -24 }" :while-in-view="{ opacity: 1, x: 0 }" :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6, ease: EASE }"
        >
          <div class="l-showcase-eyebrow">{{ t('Enfoque', 'Focus') }}</div>
          <h2 class="l-showcase-title">{{ t('Una sesión, sin ruido.', 'One session, no noise.') }}</h2>
          <p class="l-showcase-desc">
            {{ t(
              'Entra a modo enfoque de pantalla completa, corre el temporizador y deja que el resto espere. Al cerrar la sesión, registras cómo te sentiste.',
              'Enter full-screen focus mode, run the timer, and let everything else wait. When the session ends, you log how it felt.',
            ) }}
          </p>
        </motion.div>
        <motion.div
          class="l-showcase-visual"
          :initial="{ opacity: 0, x: 24 }" :while-in-view="{ opacity: 1, x: 0 }" :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6, ease: EASE, delay: 0.1 }"
        >
          <div class="l-mock-card l-mock-focus">
            <div class="l-mock-session-dots">
              <span v-for="i in 4" :key="i" class="l-mock-dot" :class="{ active: i <= 2 }" />
            </div>
            <div class="ring-wrap" style="width:128px;height:128px">
              <svg width="128" height="128" style="transform:rotate(-90deg)">
                <circle cx="64" cy="64" r="54" stroke-width="7" fill="none" stroke="var(--border-default)" />
                <circle cx="64" cy="64" r="54" stroke-width="7" fill="none" stroke="var(--amber)" stroke-linecap="round"
                  stroke-dasharray="339.3" stroke-dashoffset="140" />
              </svg>
              <div class="ring-text">
                <div style="font-family:var(--font-display);font-weight:600;font-size:24px;letter-spacing:-0.02em" class="tnum">24:59</div>
                <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.08em;margin-top:4px">{{ t('Enfoque', 'Focus') }}</div>
              </div>
            </div>
            <button class="l-mock-pill-btn">
              <PauseIcon :size="13" /> {{ t('Pausar', 'Pause') }}
            </button>
          </div>
        </motion.div>
      </section>

      <!-- Showcase: Metas y Visión -->
      <section class="l-showcase reverse">
        <motion.div
          class="l-showcase-visual"
          :initial="{ opacity: 0, x: -24 }" :while-in-view="{ opacity: 1, x: 0 }" :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6, ease: EASE }"
        >
          <div class="l-mock-card l-mock-goals">
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
        </motion.div>
        <motion.div
          class="l-showcase-copy"
          :initial="{ opacity: 0, x: 24 }" :while-in-view="{ opacity: 1, x: 0 }" :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6, ease: EASE, delay: 0.1 }"
        >
          <div class="l-showcase-eyebrow">{{ t('Metas y Visión', 'Goals & Vision') }}</div>
          <h2 class="l-showcase-title">{{ t('De la intención a la meta.', 'From intention to goal.') }}</h2>
          <p class="l-showcase-desc">
            {{ t(
              'Conecta tus hábitos a metas concretas, arma tu Vision Board y cierra cada semana con una revisión guiada.',
              'Connect your habits to concrete goals, build your Vision Board, and close every week with a guided review.',
            ) }}
          </p>
        </motion.div>
      </section>

      <!-- Showcase: Consistencia -->
      <section class="l-showcase">
        <motion.div
          class="l-showcase-copy"
          :initial="{ opacity: 0, x: -24 }" :while-in-view="{ opacity: 1, x: 0 }" :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6, ease: EASE }"
        >
          <div class="l-showcase-eyebrow">{{ t('Consistencia', 'Consistency') }}</div>
          <h2 class="l-showcase-title">{{ t('Tu patrón, a la vista.', 'Your pattern, in view.') }}</h2>
          <p class="l-showcase-desc">
            {{ t(
              'Un mapa de calor de todo tu año, al estilo GitHub. Sin trucos: solo la verdad de cuánto apareciste.',
              'A GitHub-style heatmap of your whole year. No tricks — just the truth of how often you showed up.',
            ) }}
          </p>
        </motion.div>
        <motion.div
          class="l-showcase-visual"
          :initial="{ opacity: 0, x: 24 }" :while-in-view="{ opacity: 1, x: 0 }" :viewport="{ once: true, amount: 0.5 }"
          :transition="{ duration: 0.6, ease: EASE, delay: 0.1 }"
        >
          <div class="l-mock-card l-mock-heatmap">
            <div class="l-mock-heat-grid">
              <div v-for="(lvl, i) in heatCells" :key="i" class="hm-cell" :data-l="lvl" />
            </div>
          </div>
        </motion.div>
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

.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(140px);
  opacity: 0.26;
  z-index: 0;
}
.glow-1 { width: 700px; height: 700px; top: -220px; left: -160px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); }
.glow-2 { width: 600px; height: 600px; top: 480px; right: -140px; background: radial-gradient(circle, var(--lilac-soft) 0%, transparent 70%); opacity: 0.5; }

/* Nav */
.l-nav {
  position: relative;
  z-index: 4;
  flex-shrink: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 5vw, 56px);
  border-bottom: 1px solid transparent;
  background: transparent;
  transition: background var(--transition), border-color var(--transition), backdrop-filter var(--transition);
}
.l-nav.scrolled {
  background: rgba(10, 11, 13, 0.6);
  backdrop-filter: blur(20px);
  border-bottom-color: var(--border-subtle);
}
.l-brand { display: flex; align-items: center; gap: 10px; }
.l-brand-mark {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  display: grid; place-items: center;
  font-size: 13px;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 0 6px var(--accent);
}
.l-brand-name { font-family: var(--font-display); font-weight: 600; font-size: 16px; letter-spacing: -0.02em; }

.l-nav-actions { display: flex; align-items: center; gap: 8px; }
.l-login-btn {
  display: block;
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-1);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
}

/* Scroll area */
.l-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* Hero */
.l-hero {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(48px, 9vh, 96px) 24px 64px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}
.l-hero-copy { max-width: 560px; }
.l-eyebrow {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-3); font-weight: 600; margin-bottom: 18px;
}
.l-title { margin: 0; }
.l-title-line {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(34px, 4.6vw, 56px);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.08;
}
.l-title-accent {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 500;
  background: linear-gradient(120deg, var(--accent) 0%, var(--lilac) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.l-sub {
  font-size: 16px;
  color: var(--text-2);
  max-width: 480px;
  margin: 20px 0 0;
  line-height: 1.6;
}

.l-cta-row { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
.l-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 12px;
  background: #ffffff; color: #0A0B0D;
  font-size: 14.5px; font-weight: 600;
  box-shadow: 0 4px 20px rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3);
}
.l-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-1);
  font-size: 14.5px; font-weight: 500;
}
.l-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.l-spinner {
  display: block;
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: l-spin 0.65s linear infinite;
}
@keyframes l-spin { to { transform: rotate(360deg); } }

.l-trust-row { display: flex; align-items: center; gap: 8px; margin-top: 26px; font-size: 11.5px; color: var(--text-3); }
.l-trust-sep { color: rgba(255,255,255,0.15); }

/* Hero visual / mock card */
.l-hero-visual { position: relative; display: flex; justify-content: center; perspective: 1400px; }
.l-hero-visual::before {
  content: '';
  position: absolute;
  inset: -60px;
  background: radial-gradient(circle at 50% 45%, var(--accent-glow) 0%, transparent 68%);
  filter: blur(30px);
  opacity: 0.55;
  z-index: -1;
}
.l-mock-card {
  position: relative;
  width: 100%;
  max-width: 320px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg), var(--inner-hi);
  overflow: hidden;
  transform-style: preserve-3d;
}
.l-mock-card::before {
  content: '';
  position: absolute;
  top: 0; left: 15%; right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  z-index: 1;
}
.l-mock-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.l-mock-brand { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-weight: 600; font-size: 13px; }
.l-mock-date { font-size: 11px; color: var(--text-3); }
.l-mock-body { padding: 18px; display: flex; flex-direction: column; gap: 18px; }
.l-mock-ring-row { display: flex; align-items: center; gap: 16px; }
.l-mock-streak-num { font-family: var(--font-display); font-weight: 600; font-size: 20px; letter-spacing: -0.02em; }
.l-mock-streak-label { font-size: 11px; color: var(--text-3); }
.l-mock-habits { display: flex; flex-direction: column; gap: 8px; }
.l-mock-habit { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 10px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); }
.l-mock-habit-icon { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; flex-shrink: 0; }
.l-mock-habit-text { font-size: 12.5px; font-weight: 500; color: var(--text-1); }
.l-mock-habit-text.done { color: var(--text-3); text-decoration: line-through; }

/* Marquee */
.l-marquee {
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
  padding: 18px 0;
}
.l-marquee-track { display: flex; width: max-content; animation: l-marquee 26s linear infinite; }
.l-marquee-set { display: flex; align-items: center; gap: 20px; padding-right: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3); white-space: nowrap; }
.l-marquee-dot { color: var(--accent); opacity: 0.7; font-size: 11px; }
@keyframes l-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Showcase rows */
.l-showcase {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(56px, 9vh, 96px) 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}
.l-showcase.reverse .l-showcase-copy { order: 2; }
.l-showcase.reverse .l-showcase-visual { order: 1; }
.l-showcase-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); font-weight: 600; margin-bottom: 12px; }
.l-showcase-title { font-family: var(--font-display); font-size: clamp(24px, 3vw, 32px); font-weight: 600; letter-spacing: -0.02em; margin: 0 0 14px; line-height: 1.2; }
.l-showcase-desc { font-size: 15px; color: var(--text-2); line-height: 1.65; max-width: 420px; margin: 0; }
.l-showcase-visual { position: relative; display: flex; justify-content: center; }
.l-showcase-visual::before {
  content: '';
  position: absolute;
  inset: -40px;
  background: radial-gradient(circle at 50% 45%, var(--accent-glow) 0%, transparent 68%);
  filter: blur(28px);
  opacity: 0.4;
  z-index: -1;
}
.l-showcase-visual .l-mock-card { max-width: 300px; padding: 28px 24px; display: flex; flex-direction: column; align-items: center; }

.l-mock-focus { gap: 20px; }
.l-mock-session-dots { display: flex; gap: 6px; }
.l-mock-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--border-default); }
.l-mock-dot.active { background: var(--amber); }
.l-mock-pill-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px;
  border-radius: 999px;
  background: var(--amber); color: #0A0B0D;
  font-size: 13px; font-weight: 600;
  border: none;
  box-shadow: 0 4px 16px var(--amber-soft);
}

.l-mock-goals { align-items: stretch; gap: 16px; width: 100%; }
.l-mock-goal { display: flex; flex-direction: column; gap: 8px; }
.l-mock-goal-head { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-2); font-weight: 500; }
.l-mock-goal-track { height: 6px; border-radius: 999px; background: var(--border-subtle); overflow: hidden; }
.l-mock-goal-fill { height: 100%; border-radius: 999px; }
.l-mock-vision-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px; }
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
@media (max-width: 900px) {
  .l-hero { grid-template-columns: 1fr; text-align: center; }
  .l-hero-copy { max-width: 100%; margin: 0 auto; }
  .l-cta-row, .l-trust-row { justify-content: center; }
  .l-sub { margin-left: auto; margin-right: auto; }
  .l-showcase, .l-showcase.reverse { grid-template-columns: 1fr; text-align: center; }
  .l-showcase.reverse .l-showcase-copy, .l-showcase.reverse .l-showcase-visual { order: initial; }
  .l-showcase-desc { margin-left: auto; margin-right: auto; }
}
</style>
