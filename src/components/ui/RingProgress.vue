<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  stroke?: number
  value?: number
  color?: string
  track?: string
  label?: string
  sub?: string
  fontSize?: number
}>(), {
  size: 120,
  stroke: 8,
  value: 0,
})

const r = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => circumference.value * (1 - Math.max(0, Math.min(1, props.value))))
const labelSize = computed(() => props.fontSize ?? props.size * 0.28)
</script>

<template>
  <div class="ring-wrap" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :style="{ transform: 'rotate(-90deg)' }">
      <circle
        :cx="size / 2" :cy="size / 2" :r="r"
        :stroke-width="stroke" fill="none"
        :stroke="track ?? 'var(--border-default)'"
      />
      <circle
        :cx="size / 2" :cy="size / 2" :r="r"
        :stroke-width="stroke" fill="none"
        :stroke="color ?? 'var(--accent)'"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        style="transition: stroke-dashoffset 900ms cubic-bezier(.16,1,.3,1)"
      />
    </svg>
    <div class="ring-text">
      <div>
        <div :style="{ fontSize: `${labelSize}px`, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }">
          {{ label }}
        </div>
        <div v-if="sub" style="font-size: 11px; color: var(--text-3); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em;">
          {{ sub }}
        </div>
      </div>
    </div>
  </div>
</template>
