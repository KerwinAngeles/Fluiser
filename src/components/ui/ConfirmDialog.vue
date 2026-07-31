<script setup lang="ts">
import { useConfirmDialogState } from '@/composables/useConfirm'
import { useT } from '@/composables/useLang'
import BaseModal from '@/components/ui/BaseModal.vue'
import { AlertTriangleIcon } from '@/components/icons/AppIcons'

const { isOpen, state, accept, dismiss } = useConfirmDialogState()
const t = useT()
</script>

<template>
  <BaseModal :open="isOpen" width="min(400px, 92vw)" @close="dismiss">
    <div style="padding: 24px;">
      <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px;">
        <div
          v-if="state.tone === 'danger'"
          style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--rose-soft);"
        >
          <AlertTriangleIcon :size="18" style="color: var(--rose);" />
        </div>
        <div>
          <h2 style="font-size: 16px; margin-bottom: 6px;">{{ state.title }}</h2>
          <p style="font-size: 13px; color: var(--text-2); line-height: 1.5;">{{ state.message }}</p>
        </div>
      </div>

      <div class="row" style="justify-content: flex-end;">
        <button class="btn btn-ghost" @click="dismiss">
          {{ state.cancelLabel || t('Cancelar', 'Cancel') }}
        </button>
        <button
          class="btn"
          :class="state.tone === 'danger' ? 'btn-danger' : 'btn-primary'"
          @click="accept"
        >
          {{ state.confirmLabel || t('Confirmar', 'Confirm') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
/* Confirm dialogs are invoked from within other modals (delete meta, vision item, habit…),
   so it must always stack above any modal already open, regardless of teleport mount order. */
:deep(.scrim) { z-index: 300; }
</style>
