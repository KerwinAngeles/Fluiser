<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Flui from '@/components/ui/Flui.vue'

const auth = useAuthStore()
const loadingGoogle = ref(false)
const loadingDemo = ref(false)
const error = ref('')

async function loginGoogle() {
  error.value = ''
  loadingGoogle.value = true
  try { await auth.signInWithGoogle() } catch { error.value = 'No se pudo conectar con Google' }
  loadingGoogle.value = false
}

async function loginDemo() {
  error.value = ''
  loadingDemo.value = true
  try { await auth.signInDemo() } catch { error.value = 'No se pudo iniciar el modo demostrativo' }
  loadingDemo.value = false
}
</script>

<template>
  <div class="auth-page">
  <div class="auth-split">
    <!-- Visual panel — Flui front and center, matches fluiser-rediseno-v2.html's
         split-login reference. Hidden below the form on narrow screens. -->
    <div class="auth-visual">
      <div class="auth-visual-upper">
        <div class="auth-logo">
          <svg class="auth-logo-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.5C14.5 6 19 9.8 19 14.5A7 7 0 0 1 5 14.5C5 9.8 9.5 6 12 2.5Z" fill="currentColor"/>
          </svg>
          <span class="auth-logo-name">Fluiser</span>
        </div>
        <div class="auth-visual-flui">
          <div class="auth-flui-glow" />
          <Flui state="idle" :size="220" />
        </div>
      </div>
      <div class="auth-wave-wrap" aria-hidden="true">
        <svg class="auth-wave auth-wave-back" viewBox="0 0 200 20" preserveAspectRatio="none">
          <path d="M0 10 Q12.5 2 25 10 T50 10 T75 10 T100 10 T125 10 T150 10 T175 10 T200 10 V20 H0Z" />
        </svg>
        <svg class="auth-wave auth-wave-front" viewBox="0 0 200 20" preserveAspectRatio="none">
          <path d="M0 10 Q12.5 3 25 10 T50 10 T75 10 T100 10 T125 10 T150 10 T175 10 T200 10 V20 H0Z" />
        </svg>
      </div>
      <div class="auth-visual-lower">
        <p class="auth-tagline">Pequeños pasos,<br>todos los días.</p>
      </div>
    </div>

    <!-- Form panel -->
    <div class="auth-form-panel">
      <div class="auth-form-inner">
        <!-- Compact brand mark — only shown once the visual panel is hidden -->
        <div class="auth-logo auth-logo-compact">
          <svg class="auth-logo-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.5C14.5 6 19 9.8 19 14.5A7 7 0 0 1 5 14.5C5 9.8 9.5 6 12 2.5Z" fill="currentColor"/>
          </svg>
          <span class="auth-logo-name">Fluiser</span>
        </div>

        <h1 class="auth-title">Entra a Fluiser</h1>
        <p class="auth-sub">Retoma tus hábitos donde los dejaste.</p>

        <button
          class="auth-btn auth-btn-primary"
          :class="{ loading: loadingGoogle }"
          :disabled="loadingGoogle || loadingDemo"
          @click="loginGoogle"
        >
          <span v-if="loadingGoogle" class="auth-spinner" />
          <template v-else>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continuar con Google</span>
          </template>
        </button>

        <div class="auth-or"><span>o</span></div>

        <button
          class="auth-btn auth-btn-ghost"
          :class="{ loading: loadingDemo }"
          :disabled="loadingGoogle || loadingDemo"
          @click="loginDemo"
        >
          <span v-if="loadingDemo" class="auth-spinner auth-spinner-ghost" />
          <template v-else>
            <span class="auth-sparkle">✦</span>
            <span>Acceso rápido (modo demo)</span>
          </template>
        </button>

        <Transition name="auth-err">
          <div v-if="error" class="auth-error">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5M8 10.5v.5"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <div class="auth-assurances">
          <span>Datos cifrados</span>
          <span class="auth-assurance-sep">·</span>
          <span>Solo tuyos</span>
          <span class="auth-assurance-sep">·</span>
          <span>Sin anuncios</span>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.auth-page {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  padding: 40px;
  overflow: auto;
}

.auth-split {
  width: min(1040px, 100%);
  aspect-ratio: 1.74;
  max-height: 640px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  font-family: var(--font-text);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 30px 80px -24px rgba(0, 0, 0, 0.45);
}

/* ── Visual panel ── */
.auth-visual {
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
}
.auth-visual-upper {
  flex: 1;
  min-height: 0;
  background: linear-gradient(165deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 78%, black) 100%);
  display: flex;
  flex-direction: column;
  padding: 36px 40px 0;
}
.auth-wave-wrap {
  position: relative;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;
}
.auth-wave {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 200%;
  height: 32px;
}
.auth-wave-back {
  bottom: -4px;
  fill: color-mix(in srgb, var(--accent) 45%, black);
  opacity: 0.55;
  animation: auth-wave-drift 9s linear infinite reverse;
}
.auth-wave-front {
  fill: color-mix(in srgb, var(--accent) 55%, black);
  animation: auth-wave-drift 6s linear infinite;
}
@keyframes auth-wave-drift {
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .auth-wave { animation: none; }
}
.auth-visual-lower {
  flex: 0 0 auto;
  background: color-mix(in srgb, var(--accent) 55%, black);
  padding: 8px 40px 44px;
  margin-top: -1px;
}

.auth-logo { display: flex; align-items: center; gap: 10px; }
.auth-logo-mark { width: 24px; height: 24px; color: var(--on-accent); flex-shrink: 0; }
.auth-logo-name { font-family: var(--font-display); font-weight: 700; font-size: 19px; color: var(--on-accent); }

.auth-visual-flui {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 0;
}
.auth-flui-glow {
  position: absolute;
  width: 280px; height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 60%);
  pointer-events: none;
}
/* Flui's body gradient (fixed mint/teal, same everywhere) sits too close in
   hue to this panel's teal backdrop to read on its own — a soft shadow
   gives it the separation the glow alone doesn't. */
.auth-visual-flui :deep(.flui) {
  filter: drop-shadow(0 16px 26px rgba(0, 0, 0, 0.32));
}

.auth-tagline {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: #fff;
  margin: 0;
}

/* ── Form panel ── */
.auth-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  padding: 32px;
  overflow-y: auto;
}
.auth-form-inner { width: 100%; max-width: 360px; }

.auth-logo-compact { display: none; margin-bottom: 28px; }
.auth-logo-compact .auth-logo-mark { color: var(--accent); }
.auth-logo-compact .auth-logo-name { color: var(--text-1); }

.auth-title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-1);
  margin: 0 0 8px;
}
.auth-sub { font-size: 14.5px; color: var(--text-2); margin: 0 0 32px; }

.auth-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; height: 50px; border-radius: 13px;
  font-size: 14.5px; font-weight: 600; cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.16,1,0.3,1), background 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.auth-btn:active:not(:disabled) { transform: scale(0.98); }
.auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.auth-btn-primary {
  background: var(--accent); color: var(--on-accent); border: none;
  box-shadow: 0 10px 28px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.15);
}
.auth-btn-primary:hover:not(:disabled) { background: var(--accent-deep); }

.auth-or {
  display: flex; align-items: center; gap: 12px;
  margin: 18px 0; color: var(--text-3); font-size: 12px; font-weight: 600;
}
.auth-or::before, .auth-or::after { content: ''; flex: 1; height: 1px; background: var(--border-default); }

.auth-btn-ghost {
  background: var(--bg-surface); color: var(--text-1); border: 1px solid var(--border-default);
}
.auth-btn-ghost:hover:not(:disabled) { background: var(--bg-elevated); border-color: var(--border-strong); }
.auth-sparkle { color: var(--amber); font-size: 14px; }

.auth-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: var(--on-accent);
  border-radius: 50%; animation: auth-spin 0.65s linear infinite;
}
.auth-spinner-ghost { border-color: var(--border-default); border-top-color: var(--accent); }
@keyframes auth-spin { to { transform: rotate(360deg); } }

.auth-error {
  display: flex; align-items: center; gap: 8px;
  margin-top: 16px; padding: 10px 14px; border-radius: 10px;
  background: var(--rose-soft); border: 1px solid var(--rose-soft); color: var(--rose); font-size: 12.5px;
}
.auth-err-enter-active { animation: auth-err-in 0.22s cubic-bezier(0.16,1,0.3,1); }
.auth-err-leave-active { transition: opacity 0.12s; }
.auth-err-leave-to { opacity: 0; }
@keyframes auth-err-in { from { opacity: 0; transform: translateY(-4px); } }

.auth-assurances {
  display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
  margin-top: 32px; font-size: 11.5px; color: var(--text-3);
}
.auth-assurance-sep { opacity: 0.5; }

@media (max-width: 860px) {
  .auth-page { padding: 0; }
  .auth-split {
    width: 100%;
    height: 100%;
    max-height: none;
    aspect-ratio: auto;
    border-radius: 0;
    box-shadow: none;
    grid-template-columns: 1fr;
  }
  .auth-visual { display: none; }
  .auth-logo-compact { display: flex; }
}
</style>
