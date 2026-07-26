<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useT } from '@/composables/useLang'
import { useFluiserStore } from '@/stores/fluiser'
import type { BgEffect, AccentColor } from '@/composables/useTheme'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { dark, lang, heatmap, density, typeSize, bg, accent, reduceMotion } = useTheme()
const t = useT()
const store = useFluiserStore()

// ── Background options ───────────────────────────────────────────
const bgOptions: { id: BgEffect; label: [string, string]; preview: string }[] = [
  {
    id: 'ambient',
    label: ['Ambiente', 'Ambient'],
    preview: 'radial-gradient(circle at 20% 30%, rgba(91,156,246,.5) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(111,207,151,.35) 0%, transparent 60%)',
  },
  {
    id: 'fireflies',
    label: ['Luciérnagas', 'Fireflies'],
    preview: 'radial-gradient(circle at 25% 40%, rgba(110,220,160,.7) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(110,220,160,.5) 0%, transparent 30%), radial-gradient(circle at 50% 20%, rgba(110,220,160,.6) 0%, transparent 25%)',
  },
  {
    id: 'stars',
    label: ['Estrellas', 'Stars'],
    preview: 'radial-gradient(circle at 15% 20%, #fff 0%, transparent 1%), radial-gradient(circle at 40% 60%, #fff 0%, transparent 1%), radial-gradient(circle at 70% 30%, #fff 0%, transparent 1.5%), radial-gradient(circle at 85% 70%, #fff 0%, transparent 1%), radial-gradient(circle at 55% 80%, #fff 0%, transparent 1%), radial-gradient(circle at 30% 85%, #fff 0%, transparent 0.5%), radial-gradient(circle at 90% 15%, #fff 0%, transparent 1.5%), radial-gradient(circle at 10% 55%, #fff 0%, transparent 0.8%)',
  },
  {
    id: 'aurora',
    label: ['Aurora boreal', 'Aurora'],
    preview: 'linear-gradient(180deg, rgba(110,207,151,.5) 0%, rgba(91,156,246,.4) 40%, rgba(184,168,224,.3) 70%, transparent 100%)',
  },
  {
    id: 'none',
    label: ['Ninguno', 'None'],
    preview: 'none',
  },
]

// ── Accent colors ────────────────────────────────────────────────
const accentOptions: { id: AccentColor; label: [string, string]; color: string }[] = [
  { id: 'sky',   label: ['Cielo',  'Sky'],   color: '#5b9cf6' },
  { id: 'lilac', label: ['Lila',   'Lilac'], color: '#b8a8e0' },
  { id: 'mint',  label: ['Menta',  'Mint'],  color: '#6fcf97' },
  { id: 'rose',  label: ['Rosa',   'Rose'],  color: '#f29090' },
  { id: 'amber', label: ['Ámbar',  'Amber'], color: '#e8b575' },
]

// ── Export data ──────────────────────────────────────────────────
function exportData() {
  const json = JSON.stringify(store.data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'fluiser-data.json' })
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <Transition name="settings-fade">
    <div v-if="open" class="scrim" @click.self="emit('close')">
      <div class="settings-panel">

        <!-- Header -->
        <div class="sp-head">
          <span class="sp-title">{{ t('Configuración', 'Settings') }}</span>
          <button class="sp-close" @click="emit('close')">✕</button>
        </div>

        <div class="sp-body">

          <!-- ── Apariencia ── -->
          <section class="sp-section">
            <div class="sp-section-label">{{ t('Apariencia', 'Appearance') }}</div>

            <!-- Tema -->
            <div class="sp-row">
              <span class="sp-row-label">{{ t('Tema', 'Theme') }}</span>
              <div class="sp-toggle-group">
                <button :class="['sp-tog', dark ? 'active' : '']" @click="dark = true">
                  {{ t('Oscuro', 'Dark') }}
                </button>
                <button :class="['sp-tog', !dark ? 'active' : '']" @click="dark = false">
                  {{ t('Claro', 'Light') }}
                </button>
              </div>
            </div>

            <!-- Densidad -->
            <div class="sp-row">
              <span class="sp-row-label">{{ t('Densidad', 'Density') }}</span>
              <div class="sp-toggle-group">
                <button
                  v-for="d in (['compact','regular','spacious'] as const)" :key="d"
                  :class="['sp-tog', density === d ? 'active' : '']"
                  @click="density = d"
                >{{ t(d === 'compact' ? 'Compacto' : d === 'regular' ? 'Regular' : 'Espacioso', d === 'compact' ? 'Compact' : d === 'regular' ? 'Regular' : 'Spacious') }}</button>
              </div>
            </div>

            <!-- Texto -->
            <div class="sp-row">
              <span class="sp-row-label">{{ t('Texto', 'Text') }}</span>
              <div class="sp-toggle-group">
                <button
                  v-for="s in (['small','regular','large'] as const)" :key="s"
                  :class="['sp-tog', typeSize === s ? 'active' : '']"
                  @click="typeSize = s"
                >{{ t(s === 'small' ? 'Pequeño' : s === 'regular' ? 'Regular' : 'Grande', s === 'small' ? 'Small' : s === 'regular' ? 'Regular' : 'Large') }}</button>
              </div>
            </div>

            <!-- Reducir animaciones -->
            <div class="sp-row">
              <span class="sp-row-label">{{ t('Reducir movimiento', 'Reduce motion') }}</span>
              <button
                class="sp-switch"
                :class="{ on: reduceMotion }"
                @click="reduceMotion = !reduceMotion"
              >
                <span class="sp-switch-thumb" />
              </button>
            </div>
          </section>

          <!-- ── Color de acento ── -->
          <section class="sp-section">
            <div class="sp-section-label">{{ t('Color de acento', 'Accent color') }}</div>
            <div class="accent-grid">
              <button
                v-for="a in accentOptions" :key="a.id"
                class="accent-swatch"
                :class="{ active: accent === a.id }"
                :style="{ '--sw': a.color }"
                :title="t(a.label[0], a.label[1])"
                @click="accent = a.id"
              >
                <span class="accent-dot" />
                <span v-if="accent === a.id" class="accent-check">✓</span>
              </button>
            </div>
          </section>

          <!-- ── Fondo animado ── -->
          <section class="sp-section">
            <div class="sp-section-label">{{ t('Fondo animado', 'Animated background') }}</div>
            <div class="bg-grid">
              <button
                v-for="b in bgOptions" :key="b.id"
                class="bg-card"
                :class="{ active: bg === b.id }"
                @click="bg = b.id"
              >
                <div
                  class="bg-preview"
                  :style="{ background: b.preview === 'none' ? 'var(--bg-elevated)' : b.preview }"
                >
                  <span v-if="b.preview === 'none'" class="bg-none-label">—</span>
                </div>
                <span class="bg-card-name">{{ t(b.label[0], b.label[1]) }}</span>
                <span v-if="bg === b.id" class="bg-check">✓</span>
              </button>
            </div>
          </section>

          <!-- ── Mapa de calor ── -->
          <section class="sp-section">
            <div class="sp-section-label">{{ t('Mapa de calor', 'Heatmap color') }}</div>
            <div class="sp-toggle-group">
              <button
                v-for="h in (['sky','warm','mono'] as const)" :key="h"
                :class="['sp-tog', heatmap === h ? 'active' : '']"
                @click="heatmap = h"
              >{{ h === 'sky' ? 'Sky' : h === 'warm' ? 'Warm' : 'Mono' }}</button>
            </div>
          </section>

          <!-- ── Idioma ── -->
          <section class="sp-section">
            <div class="sp-section-label">{{ t('Idioma', 'Language') }}</div>
            <div class="sp-toggle-group">
              <button :class="['sp-tog', lang === 'es' ? 'active' : '']" @click="lang = 'es'">Español</button>
              <button :class="['sp-tog', lang === 'en' ? 'active' : '']" @click="lang = 'en'">English</button>
            </div>
          </section>

          <!-- ── Datos ── -->
          <section class="sp-section">
            <div class="sp-section-label">{{ t('Datos', 'Data') }}</div>
            <button class="sp-action-btn" @click="exportData">
              {{ t('Exportar datos (JSON)', 'Export data (JSON)') }}
            </button>
          </section>

        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Scrim ── */
.scrim {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Panel ── */
.settings-panel {
  width: min(480px, 94vw);
  max-height: 88vh;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg), var(--inner-hi);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.sp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.sp-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.01em;
}
.sp-close {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--border-subtle);
  color: var(--text-2);
  font-size: 13px;
  cursor: pointer;
  display: grid; place-items: center;
  transition: background 140ms;
}
.sp-close:hover { background: var(--border-default); }

/* Body */
.sp-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 24px;
}

/* Section */
.sp-section { padding: 16px 24px; }
.sp-section + .sp-section { border-top: 1px solid var(--border-subtle); }

.sp-section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 12px;
}

/* Row */
.sp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.sp-row:last-child { margin-bottom: 0; }
.sp-row-label { font-size: 13px; color: var(--text-2); }

/* Toggle group */
.sp-toggle-group { display: flex; gap: 4px; }
.sp-tog {
  padding: 5px 12px;
  border-radius: var(--r-full);
  border: 1px solid var(--border-subtle);
  background: transparent;
  font-size: 12px;
  color: var(--text-3);
  cursor: pointer;
  transition: all 140ms;
}
.sp-tog:hover { color: var(--text-1); border-color: var(--border-default); }
.sp-tog.active {
  background: var(--accent);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

/* Switch toggle */
.sp-switch {
  width: 38px; height: 22px;
  border-radius: 999px;
  border: none;
  background: var(--border-default);
  cursor: pointer;
  position: relative;
  transition: background 200ms;
  flex-shrink: 0;
}
.sp-switch.on { background: var(--accent); }
.sp-switch-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.sp-switch.on .sp-switch-thumb { transform: translateX(16px); }

/* ── Accent swatches ── */
.accent-grid { display: flex; gap: 10px; }
.accent-swatch {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  background: var(--sw);
  cursor: pointer;
  position: relative;
  display: grid; place-items: center;
  transition: transform 140ms, border-color 140ms;
}
.accent-swatch:hover { transform: scale(1.12); }
.accent-swatch.active {
  border-color: var(--text-1);
  transform: scale(1.15);
}
.accent-dot { display: none; }
.accent-check {
  font-size: 14px;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

/* ── Background cards ── */
.bg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.bg-card {
  border-radius: 12px;
  border: 2px solid var(--border-subtle);
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: border-color 160ms, transform 160ms;
}
.bg-card:hover { transform: translateY(-1px); border-color: var(--border-default); }
.bg-card.active { border-color: var(--accent); }

.bg-preview {
  height: 64px;
  width: 100%;
  background-size: cover;
  display: grid;
  place-items: center;
  background-color: var(--bg-base);
}
.bg-none-label { font-size: 20px; color: var(--text-4); }

.bg-card-name {
  padding: 7px 8px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
  text-align: center;
}

.bg-check {
  position: absolute;
  top: 5px; right: 7px;
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
}

/* ── Action button ── */
.sp-action-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: var(--r-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-2);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 140ms, border-color 140ms;
}
.sp-action-btn:hover { background: var(--bg-elevated); border-color: var(--border-default); }

/* ── Transition ── */
.settings-fade-enter-active { animation: sf-in 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.settings-fade-leave-active { animation: sf-in 160ms ease reverse both; }
@keyframes sf-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
}
</style>
