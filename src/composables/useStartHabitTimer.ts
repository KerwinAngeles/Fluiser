import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useConfirm } from '@/composables/useConfirm'
import type { Habit } from '@/types'

/**
 * Starts a habit's timer — unless a session from a previous day is still
 * sitting open (the user forgot to close it). In that case, asks whether to
 * close the old one first instead of silently discarding its progress; once
 * closed, the user can call this again to start today's normally.
 */
export function useStartHabitTimer() {
  const store = useFluiserStore()
  const t = useT()
  const { confirm } = useConfirm()

  async function startHabitTimer(habit: Habit) {
    if (store.isStaleTimer) {
      const staleName = store.activeTimer?.name ?? ''
      const shouldClose = await confirm({
        title: t('Tenés una sesión sin cerrar', 'You have an unclosed session'),
        message: t(
          `Dejaste "${staleName}" abierta de otro día. Cerrala para poder empezar "${habit.name}".`,
          `You left "${staleName}" open from another day. Close it before starting "${habit.name}".`,
        ),
        confirmLabel: t('Cerrarla ahora', 'Close it now'),
        cancelLabel: t('Cancelar', 'Cancel'),
      })
      if (shouldClose) store.expandTimer()
      return
    }
    store.startTimer(habit)
  }

  return { startHabitTimer }
}
