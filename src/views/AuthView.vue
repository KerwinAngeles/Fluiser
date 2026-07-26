<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

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
  <div class="auth-page-container">
    <!-- Ambient Glow Effects (Subtle Apple-style lighting) -->
    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <!-- Centered Premium Apple-style Squircle Login Card -->
    <div class="auth-card">
      <div class="card-shine" />

      <!-- Brand Logo Header -->
      <div class="brand-section">
        <div class="brand-logo-glow" />
        <div class="brand-mark">
          <span class="brand-symbol">✦</span>
        </div>
        <h1 class="brand-name">Fluiser</h1>
        <p class="brand-tagline">Hábitos con intención. Progreso real.</p>
      </div>

      <!-- Features summary pills -->
      <div class="feature-pills-row">
        <div class="feature-pill"><span class="pill-dot mint-dot"></span>Hábitos</div>
        <div class="feature-pill"><span class="pill-dot lilac-dot"></span>Diario</div>
        <div class="feature-pill"><span class="pill-dot sky-dot"></span>Analytics</div>
        <div class="feature-pill"><span class="pill-dot amber-dot"></span>Timer</div>
      </div>

      <div class="auth-divider">
        <div class="divider-line" />
        <span class="divider-label">Inicia sesión con</span>
        <div class="divider-line" />
      </div>

      <!-- Authentication OAuth Group -->
      <div class="btn-group">
        <button
          class="oauth-btn google-btn"
          :class="{ loading: loadingGoogle }"
          :disabled="loadingGoogle || loadingDemo"
          @click="loginGoogle"
        >
          <span class="btn-icon-wrap">
            <span v-if="loadingGoogle" class="spinner" />
            <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="flex-shrink:0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </span>
          <span class="btn-label">Google</span>
          <span class="btn-arrow">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12l5-4-5-4"/>
            </svg>
          </span>
        </button>

      </div>

      <div class="auth-divider demo-divider">
        <div class="divider-line" />
        <span class="divider-label">¿Quieres explorar ya?</span>
        <div class="divider-line" />
      </div>

      <!-- Flagship Apple Primary Button Style (Monochromatic, High-contrast, Silver Glow) -->
      <button
        class="apple-primary-btn"
        :class="{ loading: loadingDemo }"
        :disabled="loadingGoogle || loadingDemo"
        @click="loginDemo"
      >
        <span v-if="loadingDemo" class="spinner demo-spinner" />
        <span v-else class="apple-btn-label">
          <span class="sparkle-icon">✦</span> Acceso Rápido (Modo Demo)
        </span>
      </button>

      <Transition name="err">
        <div v-if="error" class="auth-error">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5M8 10.5v.5"/>
          </svg>
          {{ error }}
        </div>
      </Transition>

      <!-- Footer assurances -->
      <div class="auth-footer">
        <span class="footer-item">
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="2" y="6" width="10" height="7" rx="1.5"/><path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2"/>
          </svg>
          Datos cifrados
        </span>
        <span class="footer-sep">·</span>
        <span class="footer-item">Solo tuyos</span>
        <span class="footer-sep">·</span>
        <span class="footer-item">Sin anuncios</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  font-family: var(--font-text);
  color: var(--text-1);
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 48px 24px;
  -webkit-overflow-scrolling: touch;
}

/* Ambient glows (Soft, deep, elegant, fully ambient Apple lights) */
.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(140px);
  opacity: 0.28;
  z-index: 1;
}
.glow-1 {
  width: 700px;
  height: 700px;
  top: -200px;
  left: -150px;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
}
.glow-2 {
  width: 600px;
  height: 600px;
  bottom: -150px;
  right: -100px;
  background: radial-gradient(circle, var(--lilac-soft) 0%, transparent 70%);
  opacity: 0.45;
}

/* Beautiful Apple Squircle Login Card with plenty of breathing room */
.auth-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(22, 22, 23, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 56px 44px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 30px 80px rgba(0, 0, 0, 0.45),
    0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(36px) saturate(140%);
  -webkit-backdrop-filter: blur(36px) saturate(140%);
  display: flex;
  flex-direction: column;
  animation: card-enter 450ms cubic-bezier(0.16, 1, 0.3, 1) both;
  z-index: 2;
}

@keyframes card-enter {
  from { opacity: 0; transform: scale(0.97) translateY(12px); }
}

.card-shine {
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
  border-radius: 0 0 1px 1px;
  pointer-events: none;
}

/* Brand */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
  position: relative;
}

.brand-logo-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  top: -20px;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%);
  filter: blur(15px);
  pointer-events: none;
  opacity: 0.6;
}

.brand-mark {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 8px 24px rgba(0,0,0,0.25);
  display: grid;
  place-items: center;
  position: relative;
  margin-bottom: 18px;
  backdrop-filter: blur(12px);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.brand-mark::before {
  content: '';
  position: absolute;
  width: 32px;
  height: 32px;
  background: var(--accent-glow);
  filter: blur(10px);
  border-radius: 50%;
  opacity: 0.8;
}

.auth-card:hover .brand-mark {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.brand-symbol {
  font-size: 24px;
  line-height: 1;
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 0 8px var(--accent);
}

.brand-name {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.04em;
  margin: 0 0 6px 0;
  color: var(--text-1);
}

.brand-tagline {
  font-size: 14px;
  color: var(--text-2);
  margin: 0;
  letter-spacing: -0.01em;
  opacity: 0.85;
}

/* Feature pills */
.feature-pills-row {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.feature-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
}

.pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.mint-dot { background: var(--mint); }
.lilac-dot { background: var(--lilac); }
.sky-dot { background: var(--accent); }
.amber-dot { background: var(--amber); }

/* Dividers */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.divider-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  font-weight: 600;
  white-space: nowrap;
}

/* OAuth buttons */
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.oauth-btn {
  display: flex;
  align-items: center;
  height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.25s,
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.oauth-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.oauth-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.oauth-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon-wrap {
  width: 48px;
  height: 100%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-label {
  flex: 1;
  text-align: center;
  font-weight: 500;
  padding-right: 12px;
}

.btn-arrow {
  width: 40px;
  height: 100%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-3);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s;
}

.oauth-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(2.5px);
  color: var(--text-2);
}

/* Spinner */
.spinner {
  display: block;
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Error box */
.auth-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--rose-soft);
  border: 1px solid rgba(232, 155, 149, 0.12);
  color: var(--rose);
  font-size: 12.5px;
}

.err-enter-active { animation: err-in 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
.err-leave-active { transition: opacity 0.12s; }
.err-leave-to { opacity: 0; }
@keyframes err-in { from { opacity: 0; transform: translateY(-4px); } }

/* Footer assurance elements */
.auth-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 36px;
  flex-wrap: wrap;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-3);
  opacity: 0.8;
}

.footer-sep {
  color: rgba(255, 255, 255, 0.1);
  font-size: 10px;
}

/* ──────────────────────────────────────────────────────────────────
   APPLE FLAGSHIP PRIMARY DEMO BUTTON
   ────────────────────────────────────────────────────────────────── */
.demo-divider {
  margin-top: 32px;
  margin-bottom: 20px;
}

.apple-primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: #ffffff;
  color: #0A0B0D;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  box-shadow: 
    0 4px 20px rgba(255, 255, 255, 0.14),
    0 1px 2px rgba(0, 0, 0, 0.3);
  transition: 
    background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.2s;
}

.apple-primary-btn:hover:not(:disabled) {
  background-color: #f2f2f3;
  transform: translateY(-1px);
  box-shadow: 
    0 6px 24px rgba(255, 255, 255, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.35);
}

.apple-primary-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.985);
}

.apple-primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sparkle-icon {
  font-size: 13px;
  color: #0A0B0D;
  margin-right: 4px;
}

.apple-btn-label {
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.01em;
}

.demo-spinner {
  border-top-color: #0A0B0D;
}
</style>
