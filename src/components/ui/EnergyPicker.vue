<script setup lang="ts">
import { ENERGY } from '@/types'
import { ICON_MAP } from '@/components/icons/AppIcons'
import { useEnergyLabel } from '@/composables/useLang'
import type { Energy } from '@/types'

const props = defineProps<{ modelValue?: Energy | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: Energy] }>()

const energyLabel = useEnergyLabel()
</script>

<template>
  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
    <button
      v-for="e in ENERGY"
      :key="e.id"
      :class="['energy-chip', modelValue === e.id ? 'active' : '']"
      @click="emit('update:modelValue', e.id as Energy)"
    >
      <component :is="ICON_MAP[e.icon] ?? ICON_MAP.Check" :size="11" />
      {{ energyLabel(e.id as Energy) }}
    </button>
  </div>
</template>
