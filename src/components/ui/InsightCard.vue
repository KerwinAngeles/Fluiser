<script setup lang="ts">
import type { Tone } from '@/types'
import { SparkleIcon } from '@/components/icons/AppIcons'

// Accent callout with a message and 1-2 actions (slot) — replaces the
// hand-rolled .fj-callout in FlowJournalView and TimerView's stale-session
// notice in later phases. Built standalone in Phase 0.
withDefaults(defineProps<{
  icon?: object
  tone?: Tone
  title: string
  message: string
}>(), {
  icon: () => SparkleIcon,
  tone: 'amber',
})
</script>

<template>
  <div :class="['insight-card', `tone-border-${tone}`]">
    <div :class="['insight-icon', `bg-tone-${tone}`]">
      <component :is="icon" :size="16" />
    </div>
    <div class="insight-body">
      <div class="insight-title">{{ title }}</div>
      <div class="insight-message">{{ message }}</div>
      <div v-if="$slots.actions" class="insight-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.insight-card {
  display: flex;
  gap: 14px;
  padding: var(--pad-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid transparent;
  border-radius: var(--r-lg);
  box-shadow: var(--inner-hi), var(--shadow-sm);
}
.tone-border-sky   { border-left-color: var(--accent); }
.tone-border-mint  { border-left-color: var(--mint); }
.tone-border-amber { border-left-color: var(--amber); }
.tone-border-rose  { border-left-color: var(--rose); }
.tone-border-lilac { border-left-color: var(--lilac); }

.insight-icon {
  width: 32px; height: 32px;
  border-radius: var(--r-sm);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.insight-body { min-width: 0; flex: 1; }
.insight-title { font-size: 14px; font-weight: 650; color: var(--text-1); margin-bottom: 3px; }
.insight-message { font-size: 13px; color: var(--text-2); line-height: 1.5; }
.insight-actions { display: flex; gap: 8px; margin-top: 12px; }
</style>
