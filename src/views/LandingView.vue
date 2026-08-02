<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useT } from '@/composables/useLang'
import {
  HabitsIcon, HeatmapIcon, FocusIcon, TimelineIcon, GoalsIcon, AnalyticsIcon,
  ArrowRightIcon, SunIcon, MoonIcon,
} from '@/components/icons/AppIcons'

const router = useRouter()
const auth = useAuthStore()
const { lang, dark } = useTheme()
const t = useT()

const loadingDemo = ref(false)

async function tryDemo() {
  loadingDemo.value = true
  try { await auth.signInDemo() } finally { loadingDemo.value = false }
}

const features = [
  {
    icon: HabitsIcon,
    tone: 'mint',
    title: t('Hábitos', 'Habits'),
    desc: t(
      'Crea hábitos organizados por categoría (Cuerpo, Mente, Creación, Conexión, Descanso) y marca tu progreso cada día.',
      'Create habits organized by category (Body, Mind, Creation, Connection, Rest) and check off your progress every day.',
    ),
  },
  {
    icon: HeatmapIcon,
    tone: 'sky',
    title: t('Consistencia', 'Consistency'),
    desc: t(
      'Un mapa de calor de todo tu año, al estilo GitHub, para ver de un vistazo dónde vives realmente el hábito.',
      'A GitHub-style heatmap of your whole year, so you can see at a glance where you actually live the habit.',
    ),
  },
  {
    icon: FocusIcon,
    tone: 'amber',
    title: t('Enfoque', 'Focus'),
    desc: t(
      'Sesiones de trabajo con temporizador y un modo de pantalla completa sin distracciones para entrar en flujo.',
      'Timed work sessions and a distraction-free full-screen mode to help you get into flow.',
    ),
  },
  {
    icon: TimelineIcon,
    tone: 'lilac',
    title: t('Flujo', 'Flow'),
    desc: t(
      'Un diario de enfoque: registra tu ánimo y energía después de cada sesión y observa tus patrones con el tiempo.',
      'A focus diary: log your mood and energy after each session and watch your patterns evolve over time.',
    ),
  },
  {
    icon: GoalsIcon,
    tone: 'rose',
    title: t('Metas y Visión', 'Goals & Vision'),
    desc: t(
      'Conecta hábitos a metas concretas, arma tu Vision Board y haz una revisión semanal guiada.',
      'Connect habits to concrete goals, build your Vision Board, and run a guided weekly review.',
    ),
  },
  {
    icon: AnalyticsIcon,
    tone: 'sky',
    title: t('Analytics', 'Analytics'),
    desc: t(
      'Tu historia en números: tendencias, rachas y estadísticas de todo lo que has construido.',
      'Your story in numbers: trends, streaks, and stats for everything you have built.',
    ),
  },
]
</script>

<template>
  <div class="landing-page">
    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <!-- Nav -->
    <header class="l-nav">
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
        <RouterLink to="/auth" class="l-login-btn">{{ t('Iniciar sesión', 'Sign in') }}</RouterLink>
      </div>
    </header>

    <main class="l-scroll">
      <!-- Hero -->
      <section class="l-hero">
        <div class="l-eyebrow">{{ t('Hábitos, enfoque y metas', 'Habits, focus and goals') }}</div>
        <h1 class="l-title">
          {{ t('Construye hábitos que se sienten', 'Build habits that feel') }}
          <span class="l-title-accent">{{ t('como tuyos.', 'like yours.') }}</span>
        </h1>
        <p class="l-sub">
          {{ t(
            'Fluiser reúne tus hábitos, tus sesiones de enfoque y tus metas en un solo lugar, con datos que son solo tuyos.',
            'Fluiser brings your habits, focus sessions and goals together in one place, with data that is only yours.',
          ) }}
        </p>

        <div class="l-cta-row">
          <RouterLink to="/auth" class="l-btn-primary">
            {{ t('Comenzar gratis', 'Get started free') }}
            <ArrowRightIcon :size="15" />
          </RouterLink>
          <button class="l-btn-secondary" :class="{ loading: loadingDemo }" :disabled="loadingDemo" @click="tryDemo">
            <span v-if="loadingDemo" class="l-spinner" />
            <span v-else>{{ t('Probar la demo', 'Try the demo') }}</span>
          </button>
        </div>

        <div class="l-trust-row">
          <span>{{ t('Datos cifrados', 'Encrypted data') }}</span>
          <span class="l-trust-sep">·</span>
          <span>{{ t('Solo tuyos', 'Yours alone') }}</span>
          <span class="l-trust-sep">·</span>
          <span>{{ t('Sin anuncios', 'No ads') }}</span>
        </div>
      </section>

      <!-- Features -->
      <section class="l-features">
        <div
          v-for="f in features" :key="f.title"
          class="l-feature-card"
        >
          <div class="l-feature-icon" :class="`bg-tone-${f.tone}`">
            <component :is="f.icon" :size="20" />
          </div>
          <h3 class="l-feature-title">{{ f.title }}</h3>
          <p class="l-feature-desc">{{ f.desc }}</p>
        </div>
      </section>

      <!-- Extra bullets -->
      <section class="l-extras">
        <div class="l-extra-item">
          <span class="l-extra-dot" />
          {{ t('Disponible en español e inglés', 'Available in Spanish and English') }}
        </div>
        <div class="l-extra-item">
          <span class="l-extra-dot" />
          {{ t('Modo claro y oscuro', 'Light and dark mode') }}
        </div>
        <div class="l-extra-item">
          <span class="l-extra-dot" />
          {{ t('Instalable como app (PWA)', 'Installable as an app (PWA)') }}
        </div>
      </section>

      <!-- Final CTA -->
      <section class="l-final-cta">
        <h2>{{ t('¿Listo para empezar?', 'Ready to start?') }}</h2>
        <p>{{ t('Crea tu cuenta en segundos o explora la demo sin registrarte.', 'Create your account in seconds, or explore the demo without signing up.') }}</p>
        <div class="l-cta-row">
          <RouterLink to="/auth" class="l-btn-primary">
            {{ t('Comenzar gratis', 'Get started free') }}
            <ArrowRightIcon :size="15" />
          </RouterLink>
        </div>
      </section>

      <footer class="l-footer">
        <span>© {{ new Date().getFullYear() }} Fluiser</span>
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

.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(140px);
  opacity: 0.26;
  z-index: 0;
}
.glow-1 { width: 700px; height: 700px; top: -220px; left: -160px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); }
.glow-2 { width: 600px; height: 600px; top: 420px; right: -140px; background: radial-gradient(circle, var(--lilac-soft) 0%, transparent 70%); opacity: 0.5; }

/* Nav */
.l-nav {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 5vw, 56px);
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(10, 11, 13, 0.5);
  backdrop-filter: blur(20px);
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
  margin-left: 6px;
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-1);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  transition: background var(--transition), border-color var(--transition);
}
.l-login-btn:hover { background: var(--bg-glass-hi); border-color: var(--border-strong); }

/* Scroll area */
.l-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Hero */
.l-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: clamp(64px, 12vh, 120px) 24px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.l-eyebrow {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-3); font-weight: 600; margin-bottom: 14px;
}
.l-title {
  font-family: var(--font-display);
  font-size: clamp(32px, 5.5vw, 52px);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
}
.l-title-accent {
  background: linear-gradient(120deg, var(--accent) 0%, var(--lilac) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.l-sub {
  font-size: 16px;
  color: var(--text-2);
  max-width: 520px;
  margin: 18px 0 0;
  line-height: 1.6;
}

.l-cta-row {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
  justify-content: center;
}
.l-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 12px;
  background: #ffffff; color: #0A0B0D;
  font-size: 14.5px; font-weight: 600;
  box-shadow: 0 4px 20px rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3);
  transition: background-color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.l-btn-primary:hover { background: #f2f2f3; transform: translateY(-1px); }
.l-btn-primary:active { transform: translateY(0) scale(0.985); }

.l-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-1);
  font-size: 14.5px; font-weight: 500;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
}
.l-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); transform: translateY(-1px); }
.l-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.l-spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: l-spin 0.65s linear infinite;
}
@keyframes l-spin { to { transform: rotate(360deg); } }

.l-trust-row {
  display: flex; align-items: center; gap: 8px;
  margin-top: 24px;
  font-size: 11.5px; color: var(--text-3);
}
.l-trust-sep { color: rgba(255,255,255,0.15); }

/* Features */
.l-features {
  max-width: 1040px;
  margin: 0 auto;
  padding: 40px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.l-feature-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-lg);
  padding: 24px;
  box-shadow: var(--inner-hi), var(--shadow-sm);
}
.l-feature-icon {
  width: 40px; height: 40px;
  border-radius: 11px;
  display: grid; place-items: center;
  margin-bottom: 16px;
}
.l-feature-title { font-size: 15.5px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.01em; }
.l-feature-desc { font-size: 13.5px; color: var(--text-2); line-height: 1.55; margin: 0; }

/* Extras */
.l-extras {
  max-width: 1040px;
  margin: 8px auto 0;
  padding: 0 24px 56px;
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  justify-content: center;
}
.l-extra-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 13.5px; color: var(--text-2);
}
.l-extra-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

/* Final CTA */
.l-final-cta {
  max-width: 560px;
  margin: 0 auto;
  padding: 56px 24px;
  text-align: center;
  border-top: 1px solid var(--border-subtle);
}
.l-final-cta h2 {
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}
.l-final-cta p {
  font-size: 14.5px;
  color: var(--text-2);
  margin: 0;
}

.l-footer {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: var(--text-3);
}
</style>
