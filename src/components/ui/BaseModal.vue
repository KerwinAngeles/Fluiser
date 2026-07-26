<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  width?: string
}>(), { width: 'min(520px, 92vw)' })

const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, (val) => {
  if (val) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
})

onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="scrim" @click="emit('close')">
        <div class="modal" :style="{ width }" @click.stop>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active { animation: scrim-fade 200ms ease both; }
.modal-leave-active { animation: scrim-fade 160ms ease reverse both; pointer-events: none; }
@keyframes scrim-fade { from { opacity: 0; } }
</style>
