<script setup lang="ts">
import { computed } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { FlameIcon } from '@/components/icons/AppIcons'

const props = defineProps<{ habitId: string }>()
const store = useFluiserStore()
const streak = computed(() => store.streakOf(props.habitId))
</script>

<template>
  <span v-if="streak.current > 0" class="pill" style="background: var(--amber-soft); color: var(--amber);">
    <FlameIcon :size="11" />
    {{ streak.current }}
  </span>
</template>
