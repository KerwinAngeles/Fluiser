<script setup lang="ts">
// Agua — the universal "water fill" progress metaphor from
// fluiser-rediseno-v2.html, replacing rings everywhere (today's progress,
// timer countdown, PiP, duration dial). Reads --agua-fondo/--agua-linea/
// --agua-color from an ancestor (the Noche/PiP wrappers set these locally,
// exactly like the source document) unless `tone` overrides them directly.
import { computed } from 'vue'
import type { Tone } from '@/types'

const props = withDefaults(defineProps<{
  progress: number // 0-100
  size?: number
  tone?: Tone
}>(), {
  size: 120,
})

const style = computed(() => {
  const s: Record<string, string> = {
    width: `${props.size}px`,
    height: `${props.size}px`,
    '--p': String(Math.max(0, Math.min(100, props.progress))),
  }
  if (props.tone) s['--agua-color'] = `color-mix(in srgb, var(--${props.tone}) 45%, transparent)`
  return s
})
</script>

<template>
  <div class="agua" :style="style">
    <div class="nivel">
      <svg class="ola b" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0 5 Q12.5 0 25 5 T50 5 T75 5 T100 5 T125 5 T150 5 T175 5 T200 5 V10 H0Z" /></svg>
      <svg class="ola" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0 5 Q12.5 0 25 5 T50 5 T75 5 T100 5 T125 5 T150 5 T175 5 T200 5 V10 H0Z" /></svg>
    </div>
    <div class="dentro"><slot /></div>
  </div>
</template>

<style scoped>
.agua {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: var(--agua-fondo, var(--bg-elevated));
  box-shadow: inset 0 0 0 var(--agua-borde, 3px) var(--agua-linea, var(--border-default));
  flex-shrink: 0;
}
.agua .nivel {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: calc(var(--p, 0) * 1%);
  background: var(--agua-color, color-mix(in srgb, var(--accent) 45%, transparent));
  transition: height var(--m-suave) var(--ease-agua);
}
.agua .ola {
  position: absolute; left: 0; bottom: calc(100% - 1px);
  width: 200%; height: 10px;
  fill: var(--agua-color, color-mix(in srgb, var(--accent) 45%, transparent));
  animation: ola 3.2s linear infinite;
}
.agua .ola.b { opacity: .5; animation-duration: 5s; animation-direction: reverse; height: 12px; }
@keyframes ola { to { transform: translateX(-50%); } }
.agua .dentro { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; z-index: 1; }
</style>
