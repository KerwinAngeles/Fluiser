<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useT } from '@/composables/useLang'
import { useFluiserStore } from '@/stores/fluiser'
import type { BgEffect, AccentColor } from '@/composables/useTheme'

const { dark, lang, heatmap, density, typeSize, bg, accent, reduceMotion } = useTheme()
const t = useT()
const store = useFluiserStore()

const bgOptions: { id: BgEffect; label: [string, string]; preview: string }[] = [
  {
    id: 'ambient',
    label: ['Ambiente', 'Ambient'],
    preview: 'radial-gradient(circle at 20% 30%, rgba(91,156,246,.55) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(111,207,151,.4) 0%, transparent 60%)',
  },
  {
    id: 'aurora-boreal',
    label: ['Aurora Boreal', 'Aurora Borealis'],
    preview: 'linear-gradient(175deg, rgba(16,210,140,.5) 0%, rgba(60,160,255,.45) 40%, rgba(100,80,255,.35) 70%, rgba(16,210,140,.2) 100%)',
  },
  {
    id: 'cosmos',
    label: ['Cosmos', 'Cosmos'],
    preview: 'radial-gradient(circle at 20% 20%, rgba(220,185,100,.6) 0%, transparent 2%), radial-gradient(circle at 60% 40%, rgba(220,185,100,.5) 0%, transparent 1.5%), radial-gradient(circle at 80% 70%, rgba(220,185,100,.55) 0%, transparent 2%), radial-gradient(circle at 35% 75%, rgba(220,185,100,.45) 0%, transparent 1%), #020308',
  },
  {
    id: 'zen',
    label: ['Japonés Zen', 'Japanese Zen'],
    preview: 'linear-gradient(135deg, rgba(80,90,160,.4) 0%, rgba(60,110,140,.3) 50%, rgba(200,188,135,.1) 100%), #080d20',
  },
  {
    id: 'terrario',
    label: ['Terrario Neon', 'Neon Terrarium'],
    preview: 'radial-gradient(circle at 20% 80%, rgba(14,180,140,.35) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14,180,140,.25) 0%, transparent 40%), radial-gradient(circle at 60% 60%, rgba(255,90,110,.2) 0%, transparent 30%), #060d0c',
  },
  {
    id: 'watercolor',
    label: ['Acuarela', 'Watercolor'],
    preview: 'radial-gradient(ellipse at 20% 20%, rgba(255,165,115,.55) 0%, transparent 55%), radial-gradient(ellipse at 75% 30%, rgba(195,168,240,.45) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(248,228,140,.4) 0%, transparent 50%)',
  },
  {
    id: 'geometry',
    label: ['Geometría', 'Geometry'],
    preview: 'radial-gradient(circle at 50% 50%, rgba(200,165,55,.25) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(200,165,55,.12) 0%, transparent 70%), #030308',
  },
  {
    id: 'fireflies',
    label: ['Luciérnagas', 'Fireflies'],
    preview: 'radial-gradient(circle at 25% 40%, rgba(110,220,160,.7) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(110,220,160,.5) 0%, transparent 30%), radial-gradient(circle at 50% 20%, rgba(110,220,160,.6) 0%, transparent 25%)',
  },
  {
    id: 'stars',
    label: ['Estrellas', 'Stars'],
    preview: 'radial-gradient(circle at 15% 20%, #fff 0%, transparent 1%), radial-gradient(circle at 40% 60%, #fff 0%, transparent 1%), radial-gradient(circle at 70% 30%, #fff 0%, transparent 1.5%), radial-gradient(circle at 85% 70%, #fff 0%, transparent 1%), radial-gradient(circle at 55% 80%, #fff 0%, transparent 1%), radial-gradient(circle at 10% 55%, #fff 0%, transparent 0.8%)',
  },
  {
    id: 'aurora',
    label: ['Aurora clásica', 'Classic Aurora'],
    preview: 'linear-gradient(180deg, rgba(110,207,151,.5) 0%, rgba(91,156,246,.4) 40%, rgba(184,168,224,.3) 70%, transparent 100%)',
  },
  {
    id: 'none',
    label: ['Ninguno', 'None'],
    preview: 'none',
  },
]

const accentOptions: { id: AccentColor; label: [string, string]; color: string }[] = [
  { id: 'sky',   label: ['Cielo',  'Sky'],   color: '#5b9cf6' },
  { id: 'lilac', label: ['Lila',   'Lilac'], color: '#b8a8e0' },
  { id: 'mint',  label: ['Menta',  'Mint'],  color: '#6fcf97' },
  { id: 'rose',  label: ['Rosa',   'Rose'],  color: '#f29090' },
  { id: 'amber', label: ['Ámbar',  'Amber'], color: '#e8b575' },
]

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
  <div class="screen">
    <div class="screen-head">
      <div>
        <div class="screen-eyebrow">{{ t('Personalización', 'Personalization') }}</div>
        <h1 class="screen-title">{{ t('Configuración', 'Settings') }}</h1>
      </div>
    </div>

    <div class="settings-layout">

      <!-- ── Left column ── -->
      <div class="settings-col">

        <!-- Apariencia -->
        <div class="sp-card">
          <div class="sp-card-title">{{ t('Apariencia', 'Appearance') }}</div>

          <div class="sp-row">
            <span class="sp-row-label">{{ t('Tema', 'Theme') }}</span>
            <div class="sp-toggle-group">
              <button :class="['sp-tog', dark ? 'active' : '']" @click="dark = true">{{ t('Oscuro', 'Dark') }}</button>
              <button :class="['sp-tog', !dark ? 'active' : '']" @click="dark = false">{{ t('Claro', 'Light') }}</button>
            </div>
          </div>

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

          <div class="sp-row" style="margin-bottom:0">
            <span class="sp-row-label">{{ t('Reducir movimiento', 'Reduce motion') }}</span>
            <button class="sp-switch" :class="{ on: reduceMotion }" @click="reduceMotion = !reduceMotion">
              <span class="sp-switch-thumb" />
            </button>
          </div>
        </div>

        <!-- Color de acento -->
        <div class="sp-card">
          <div class="sp-card-title">{{ t('Color de acento', 'Accent color') }}</div>
          <div class="accent-grid">
            <button
              v-for="a in accentOptions" :key="a.id"
              class="accent-swatch"
              :class="{ active: accent === a.id }"
              :style="{ '--sw': a.color }"
              :title="t(a.label[0], a.label[1])"
              @click="accent = a.id"
            >
              <span v-if="accent === a.id" class="accent-check">✓</span>
            </button>
          </div>
        </div>

        <!-- Mapa de calor + Idioma in a row -->
        <div class="sp-card">
          <div class="sp-card-title">{{ t('Mapa de calor', 'Heatmap') }}</div>
          <div class="sp-toggle-group">
            <button
              v-for="h in (['sky','warm','mono'] as const)" :key="h"
              :class="['sp-tog', heatmap === h ? 'active' : '']"
              @click="heatmap = h"
            >{{ h === 'sky' ? 'Sky' : h === 'warm' ? 'Warm' : 'Mono' }}</button>
          </div>
        </div>

        <!-- Idioma -->
        <div class="sp-card">
          <div class="sp-card-title">{{ t('Idioma', 'Language') }}</div>
          <div class="sp-toggle-group">
            <button :class="['sp-tog', lang === 'es' ? 'active' : '']" @click="lang = 'es'">Español</button>
            <button :class="['sp-tog', lang === 'en' ? 'active' : '']" @click="lang = 'en'">English</button>
          </div>
        </div>

        <!-- Datos -->
        <div class="sp-card">
          <div class="sp-card-title">{{ t('Datos', 'Data') }}</div>
          <button class="sp-action-btn" @click="exportData">
            {{ t('Exportar datos (JSON)', 'Export data (JSON)') }}
          </button>
        </div>

      </div>

      <!-- ── Right column: Backgrounds ── -->
      <div class="sp-card sp-bg-card">
        <div class="sp-card-title">{{ t('Fondo animado', 'Animated background') }}</div>
        <div class="bg-grid">
          <button
            v-for="b in bgOptions" :key="b.id"
            class="bg-item"
            :class="{ active: bg === b.id }"
            @click="bg = b.id"
          >
            <div
              class="bg-thumb"
              :style="{ background: b.preview === 'none' ? 'var(--bg-base)' : b.preview }"
            >
              <span v-if="b.preview === 'none'" class="bg-none-icon">—</span>
              <span v-if="bg === b.id" class="bg-selected-check">✓</span>
            </div>
            <span class="bg-label">{{ t(b.label[0], b.label[1]) }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Override screen width ── */
.screen { max-width: 1100px; }

/* ── Two-column layout ── */
.settings-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}

.settings-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Cards ── */
.sp-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--r-xl);
  padding: 22px 24px;
}
.sp-card-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 18px;
}

/* ── Rows ── */
.sp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.sp-row-label { font-size: 13px; color: var(--text-2); }

/* ── Toggle group ── */
.sp-toggle-group { display: flex; gap: 4px; flex-wrap: wrap; }
.sp-tog {
  padding: 6px 14px;
  border-radius: var(--r-full);
  border: 1px solid var(--border-subtle);
  background: transparent;
  font-size: 12px;
  color: var(--text-3);
  cursor: pointer;
  transition: all 140ms;
  white-space: nowrap;
}
.sp-tog:hover { color: var(--text-1); border-color: var(--border-default); }
.sp-tog.active {
  background: var(--accent);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

/* ── Switch ── */
.sp-switch {
  width: 40px; height: 23px;
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
  width: 17px; height: 17px;
  border-radius: 50%;
  background: #fff;
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.sp-switch.on .sp-switch-thumb { transform: translateX(17px); }

/* ── Accent swatches ── */
.accent-grid { display: flex; gap: 14px; }
.accent-swatch {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  background: var(--sw);
  cursor: pointer;
  position: relative;
  display: grid; place-items: center;
  transition: transform 140ms, border-color 140ms;
}
.accent-swatch:hover { transform: scale(1.1); }
.accent-swatch.active { border-color: var(--text-1); transform: scale(1.14); }
.accent-check {
  font-size: 15px; color: #fff; font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

/* ── Action button ── */
.sp-action-btn {
  width: 100%;
  padding: 11px 16px;
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

/* ── Background grid (right column) ── */
.sp-bg-card { height: fit-content; }
.bg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}
.bg-item {
  border-radius: var(--r-lg);
  border: 2px solid var(--border-subtle);
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: border-color 160ms, transform 160ms;
}
.bg-item:hover { transform: translateY(-2px); border-color: var(--border-default); }
.bg-item.active { border-color: var(--accent); }

.bg-thumb {
  height: 80px;
  width: 100%;
  background-color: var(--bg-base);
  background-size: cover;
  position: relative;
  display: grid;
  place-items: center;
}
.bg-none-icon { font-size: 24px; color: var(--text-4); }
.bg-selected-check {
  position: absolute;
  top: 6px; right: 8px;
  font-size: 13px;
  color: var(--accent);
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0,0,0,0.6);
}

.bg-label {
  padding: 8px 8px 9px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
