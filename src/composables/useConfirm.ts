import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

interface ConfirmState extends Required<ConfirmOptions> {}

const isOpen = ref(false)
const state = ref<ConfirmState>({
  title: '', message: '', confirmLabel: '', cancelLabel: '', tone: 'default',
})
let resolver: ((value: boolean) => void) | null = null

function settle(value: boolean) {
  isOpen.value = false
  resolver?.(value)
  resolver = null
}

/** Call from anywhere to show the app's shared confirm modal. Resolves true/false. */
export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    settle(false)
    state.value = {
      confirmLabel: opts.confirmLabel ?? '',
      cancelLabel: opts.cancelLabel ?? '',
      tone: opts.tone ?? 'default',
      title: opts.title,
      message: opts.message,
    }
    isOpen.value = true
    return new Promise((resolve) => { resolver = resolve })
  }
  return { confirm }
}

/** Internal — consumed only by ConfirmDialog.vue, the single instance mounted in App.vue. */
export function useConfirmDialogState() {
  return { isOpen, state, accept: () => settle(true), dismiss: () => settle(false) }
}
