<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useT } from '@/composables/useLang'
import { SunIcon, MoonIcon } from '@/components/icons/AppIcons'

const { dark, lang } = useTheme()
const t = useT()
</script>

<template>
  <div class="top-controls">
    <!-- Dark / Light -->
    <button
      class="tc-btn"
      :title="dark ? t('Modo claro', 'Light mode') : t('Modo oscuro', 'Dark mode')"
      @click="dark = !dark"
    >
      <Transition name="tc-icon" mode="out-in">
        <SunIcon v-if="dark" :key="'sun'" :size="14" />
        <MoonIcon v-else :key="'moon'" :size="14" />
      </Transition>
    </button>

    <div class="tc-sep" />

    <!-- Language -->
    <button class="tc-btn tc-lang" @click="lang = lang === 'es' ? 'en' : 'es'">
      {{ lang === 'es' ? 'EN' : 'ES' }}
    </button>
  </div>
</template>

<style scoped>
.top-controls {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: var(--bg-glass);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm), var(--inner-hi);
}

.tc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--text-2);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}
.tc-btn:hover {
  background: var(--border-subtle);
  color: var(--text-1);
}

.tc-lang {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  width: auto;
  padding: 0 10px;
}

.tc-sep {
  width: 1px;
  height: 14px;
  background: var(--border-default);
  flex-shrink: 0;
}

/* icon swap animation */
.tc-icon-enter-active { animation: tc-pop 180ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.tc-icon-leave-active { animation: tc-pop 120ms ease reverse both; }
@keyframes tc-pop {
  from { opacity: 0; transform: scale(0.7) rotate(-15deg); }
}
</style>
