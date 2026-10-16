<script setup lang="ts">
// Flui — the mascot from fluiser-rediseno-v2.html, ported verbatim (same
// paths, same per-state part visibility, same keyframes). Each instance
// gets its own gradient ids so several Flui's can be on screen at once
// (sidebar dock + an active session + its PiP) without fighting over one
// <linearGradient>.
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

export type FluiState = 'idle' | 'pista' | 'feliz' | 'celebra' | 'enfoque' | 'dormido' | 'saludo' | 'sorprendido' | 'preocupado'

const props = withDefaults(defineProps<{
  state?: FluiState
  size?: number
}>(), {
  state: 'idle',
  size: 64,
})

const { fluiPresence } = useTheme()
const visible = computed(() => fluiPresence.value !== 'oculto')
// 'icono' is a quieter presence — same character, capped smaller wherever a
// caller asked for a bigger one.
const effectiveSize = computed(() => fluiPresence.value === 'icono' ? Math.min(28, props.size) : props.size)

const uid = Math.random().toString(36).slice(2, 9)
const gradBody = `fluiCuerpo-${uid}`
const gradFoco = `fluiFoco-${uid}`
const style = computed(() => ({ width: `${effectiveSize.value}px` }))
</script>

<template>
  <svg v-if="visible" class="flui" :data-state="state" :style="style" viewBox="0 0 200 205" role="img" aria-label="Flui">
    <defs>
      <linearGradient :id="gradBody" x1="0.3" y1="0" x2="0.6" y2="1">
        <stop offset="0" style="stop-color:var(--flui-top)" /><stop offset="1" style="stop-color:var(--flui-bottom)" />
      </linearGradient>
      <linearGradient :id="gradFoco" x1="0.3" y1="0" x2="0.6" y2="1">
        <stop offset="0" style="stop-color:var(--foco-top)" /><stop offset="1" style="stop-color:var(--foco-bottom)" />
      </linearGradient>
    </defs>
    <ellipse class="f-shadow" cx="100" cy="196" rx="44" ry="6" />
    <g class="f-float">
      <g class="f-body">
        <g class="f-sprout">
          <path class="f-stem" d="M100 42 C98 30 100 20 106 12" />
          <path class="f-leaf" d="M105 14 C112 0 132 1 138 8 C129 19 114 22 105 14Z" />
          <path class="f-leaf2" d="M101 27 C93 16 80 17 76 23 C84 31 95 31 101 27Z" />
        </g>
        <path class="f-shape" :fill="`url(#${state === 'enfoque' ? gradFoco : gradBody})`" d="M100 36 C118 60 158 94 158 134 C158 168 132 190 100 190 C68 190 42 168 42 134 C42 94 82 60 100 36Z" />
        <ellipse cx="74" cy="106" rx="8" ry="16" transform="rotate(-26 74 106)" fill="#fff" opacity=".55" />
        <circle cx="67" cy="152" r="9" class="f-cheek" /><circle cx="133" cy="152" r="9" class="f-cheek" />
        <g class="f-part e-open">
          <g class="f-eye"><ellipse class="f-ink" cx="81" cy="136" rx="7.5" ry="10" /><circle cx="83.5" cy="131.5" r="2.8" fill="#fff" /></g>
          <g class="f-eye"><ellipse class="f-ink" cx="119" cy="136" rx="7.5" ry="10" /><circle cx="121.5" cy="131.5" r="2.8" fill="#fff" /></g>
        </g>
        <g class="f-part e-happy"><path class="f-stroke" d="M72 139 Q81 126 90 139" /><path class="f-stroke" d="M110 139 Q119 126 128 139" /></g>
        <g class="f-part e-closed"><path class="f-stroke" d="M72 134 Q81 143 90 134" /><path class="f-stroke" d="M110 134 Q119 143 128 134" /></g>
        <g class="f-part e-sleepy"><path class="f-stroke" d="M73 138 L89 138" /><path class="f-stroke" d="M111 138 L127 138" /></g>
        <g class="f-part e-grandes">
          <circle class="f-ink" cx="81" cy="135" r="10.5" /><circle cx="84" cy="131" r="3.4" fill="#fff" />
          <circle class="f-ink" cx="119" cy="135" r="10.5" /><circle cx="122" cy="131" r="3.4" fill="#fff" />
          <path class="f-stroke f-stroke-fine" d="M70 116 Q80 109 90 115" />
          <path class="f-stroke f-stroke-fine" d="M110 115 Q120 109 130 116" />
        </g>
        <g class="f-part e-preocupados">
          <ellipse class="f-ink" cx="81" cy="138" rx="6.5" ry="8.5" /><circle cx="83" cy="134.5" r="2.3" fill="#fff" />
          <ellipse class="f-ink" cx="119" cy="138" rx="6.5" ry="8.5" /><circle cx="121" cy="134.5" r="2.3" fill="#fff" />
          <path class="f-stroke f-stroke-fine" d="M71 121 L89 125" />
          <path class="f-stroke f-stroke-fine" d="M129 121 L111 125" />
        </g>
        <path class="f-part m-smile f-stroke" d="M92 155 Q100 162 108 155" />
        <path class="f-part m-open f-ink" d="M89 152 Q100 172 111 152 Z" />
        <ellipse class="f-part m-o f-ink" cx="100" cy="158" rx="4.5" ry="5.5" />
        <ellipse class="f-part m-ogrande f-ink" cx="100" cy="160" rx="7" ry="9" />
        <path class="f-part m-ondulada f-stroke f-stroke-fine" d="M90 160 Q95 154 100 159 Q105 164 110 158" />
        <path class="f-part f-sudor" d="M146 100 C149 106 152 109 152 113 A6 6 0 0 1 140 113 C140 109 143 106 146 100Z" />
      </g>
      <g class="f-part f-idea"><circle cx="158" cy="52" r="10" /><path d="M158 30 L158 24" /><path d="M175 38 L180 34" /><path d="M141 38 L136 34" /></g>
    </g>
    <g class="f-part f-sparks">
      <path class="f-spark" d="M30 70 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" />
      <path class="f-spark" d="M168 92 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
      <path class="f-spark" d="M150 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
      <path class="f-spark" d="M46 30 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
    </g>
    <g class="f-part f-zz"><text class="f-z" x="148" y="80" font-size="22">z</text><text class="f-z" x="148" y="80" font-size="17">z</text><text class="f-z" x="148" y="80" font-size="13">z</text></g>
  </svg>
</template>

<style scoped>
.flui { display: block; overflow: visible; flex-shrink: 0; }
.flui .f-ink { fill: var(--flui-ink); }
.flui .f-stroke { fill: none; stroke: var(--flui-ink); stroke-width: 4.5; stroke-linecap: round; }
.flui .f-stroke-fine { stroke-width: 3.6; }
.flui .f-cheek { fill: #FF9D8A; opacity: .45; }
.flui .f-part { opacity: 0; transition: opacity .25s; }
.flui .f-shadow { fill: #000; opacity: .14; transform-box: fill-box; transform-origin: center; }
.flui .f-body, .flui .f-float { transform-box: view-box; transform-origin: 100px 190px; }
.flui .f-sprout { transform-box: view-box; transform-origin: 100px 40px; }
.flui .f-eye { transform-box: fill-box; transform-origin: center; }
.flui .f-leaf { fill: #5E9E6B; transform-box: view-box; transform-origin: 106px 14px; }
.flui .f-leaf2 { fill: #9FD39B; }
.flui .f-sudor { fill: #9FE6FF; }
.flui .f-stem { fill: none; stroke: #5E9E6B; stroke-width: 4; stroke-linecap: round; }
.flui .f-spark { fill: var(--amber); }
.flui .f-z { font-family: var(--font-display); font-weight: 800; fill: currentColor; opacity: .7; }
.flui .f-idea circle { fill: var(--amber); }
.flui .f-idea path { stroke: var(--amber); stroke-width: 3; stroke-linecap: round; }

.flui[data-state="idle"] .e-open, .flui[data-state="idle"] .m-smile,
.flui[data-state="pista"] .e-open, .flui[data-state="pista"] .m-o, .flui[data-state="pista"] .f-idea,
.flui[data-state="feliz"] .e-happy, .flui[data-state="feliz"] .m-open,
.flui[data-state="celebra"] .e-happy, .flui[data-state="celebra"] .m-open, .flui[data-state="celebra"] .f-sparks,
.flui[data-state="enfoque"] .e-closed, .flui[data-state="enfoque"] .m-smile,
.flui[data-state="dormido"] .e-sleepy, .flui[data-state="dormido"] .m-o, .flui[data-state="dormido"] .f-zz,
.flui[data-state="saludo"] .e-happy, .flui[data-state="saludo"] .m-smile,
.flui[data-state="sorprendido"] .e-grandes, .flui[data-state="sorprendido"] .m-ogrande,
.flui[data-state="preocupado"] .e-preocupados, .flui[data-state="preocupado"] .m-ondulada, .flui[data-state="preocupado"] .f-sudor { opacity: 1; }

@media (prefers-reduced-motion: no-preference) {
  .flui .f-sprout { animation: f-sway 4s ease-in-out infinite; }
  .flui[data-state="idle"] .f-float, .flui[data-state="pista"] .f-float { animation: f-float 3.6s ease-in-out infinite; }
  .flui[data-state="idle"] .f-shadow, .flui[data-state="pista"] .f-shadow { animation: f-shadow 3.6s ease-in-out infinite; }
  .flui[data-state="idle"] .f-eye, .flui[data-state="pista"] .f-eye { animation: f-blink 4.2s infinite; }
  .flui[data-state="pista"] .f-body { animation: f-tilt 3s ease-in-out infinite; }
  .flui[data-state="pista"] .f-idea { animation: f-pulse 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .flui[data-state="feliz"] .f-body { animation: f-hop 1.2s var(--ease-agua) infinite; }
  .flui[data-state="celebra"] .f-body { animation: f-hop .9s var(--ease-agua) infinite; }
  .flui[data-state="celebra"] .f-spark { animation: f-twinkle .9s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .flui[data-state="celebra"] .f-spark:nth-child(2) { animation-delay: .2s; }
  .flui[data-state="celebra"] .f-spark:nth-child(3) { animation-delay: .4s; }
  .flui[data-state="celebra"] .f-spark:nth-child(4) { animation-delay: .6s; }
  .flui[data-state="enfoque"] .f-body { animation: f-breathe var(--m-respira) ease-in-out infinite; }
  .flui[data-state="enfoque"] .f-sprout { animation-duration: 8s; }
  .flui[data-state="dormido"] .f-body { animation: f-doze 5s ease-in-out infinite; }
  .flui[data-state="dormido"] .f-z { animation: f-rise 3s ease-out infinite; }
  .flui[data-state="dormido"] .f-z:nth-child(2) { animation-delay: 1s; }
  .flui[data-state="dormido"] .f-z:nth-child(3) { animation-delay: 2s; }
  .flui[data-state="saludo"] .f-leaf { animation: f-wave-leaf 1.1s ease-in-out infinite; }
  .flui[data-state="saludo"] .f-body { animation: f-tilt-greet 2.2s ease-in-out infinite; }
  .flui[data-state="sorprendido"] .f-body { animation: f-pop .55s cubic-bezier(.34,1.56,.64,1) 1; }
  .flui[data-state="preocupado"] .f-body { animation: f-shake 2.4s linear infinite; }
  .flui[data-state="preocupado"] .f-sudor { animation: f-sweat 1.8s ease-in infinite; }
}
@keyframes f-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes f-shadow { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.86); } }
@keyframes f-blink { 0%, 90%, 100% { transform: scaleY(1); } 93% { transform: scaleY(.1); } 96% { transform: scaleY(1); } }
@keyframes f-sway { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(7deg); } }
@keyframes f-tilt { 0%, 100% { transform: rotate(0); } 40%, 70% { transform: rotate(-7deg); } }
@keyframes f-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
@keyframes f-hop { 0%, 100% { transform: translateY(0) scale(1, 1); } 18% { transform: scale(1.08, .92); } 45% { transform: translateY(-22px) scale(.95, 1.05); } 72% { transform: translateY(0) scale(1.05, .95); } }
@keyframes f-twinkle { 0%, 100% { transform: scale(.4) rotate(0); opacity: .3; } 50% { transform: scale(1.15) rotate(45deg); opacity: 1; } }
@keyframes f-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes f-doze { 0%, 100% { transform: rotate(-3deg) translateY(2px); } 50% { transform: rotate(3deg); } }
@keyframes f-rise { 0% { transform: translate(0, 0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(14px, -34px); opacity: 0; } }
@keyframes f-wave-leaf {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-32deg); }
  40% { transform: rotate(20deg); }
  60% { transform: rotate(-28deg); }
  80% { transform: rotate(14deg); }
}
@keyframes f-tilt-greet { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-6deg); } 60% { transform: rotate(4deg); } }
@keyframes f-pop {
  0% { transform: translateY(0) scale(1, 1); }
  30% { transform: translateY(-14px) scale(.94, 1.08); }
  65% { transform: translateY(0) scale(1.06, .94); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes f-shake {
  0%, 30%, 100% { transform: rotate(0); }
  4% { transform: rotate(-5deg); } 8% { transform: rotate(5deg); }
  12% { transform: rotate(-4deg); } 16% { transform: rotate(4deg); }
  20% { transform: rotate(-2deg); } 24% { transform: rotate(2deg); }
}
@keyframes f-sweat {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  85% { transform: translateY(18px); opacity: 1; }
  100% { transform: translateY(24px); opacity: 0; }
}
</style>
