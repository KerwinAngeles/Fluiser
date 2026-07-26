<script setup lang="ts">
import type { Mood } from '@/types'

const props = defineProps<{ mood: Mood; active?: boolean }>()
const emit = defineEmits<{ click: [] }>()

const MOOD_PATHS: Record<Mood, string> = {
  great: `<circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/><path d="M7 14c1.5 2.5 8.5 2.5 10 0"/>`,
  good:  `<circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/><path d="M8 14c1 1.5 7 1.5 8 0"/>`,
  okay:  `<circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/><path d="M8 14h8"/>`,
  low:   `<circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/><path d="M8 15c1-1.5 7-1.5 8 0"/>`,
  rough: `<path d="M8 11l2-1M14 10l2 1"/><path d="M8 15c1-2 7-2 8 0"/>`,
}
</script>

<template>
  <button :class="['mood-face', active ? 'active' : '']" @click="emit('click')">
    <svg viewBox="0 0 24 24" v-html="MOOD_PATHS[mood]" />
  </button>
</template>
