import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import type { FluiState } from '@/components/ui/Flui.vue'

const TIPS_KEY = 'fluiser.flui.tips-vistos'

// Module-level shared state (same pattern as useConfirm.ts) — every Flui.vue
// instance on screen (sidebar dock, an active session, its PiP) reflects the
// same mood, driven from one composable rather than each mascot reacting on
// its own.
const estado = ref<FluiState>('idle')
const consejoTexto = ref<string | null>(null)

let revertTimer: ReturnType<typeof setTimeout> | null = null
let fijado = false

function loadShownTips(): Set<string> {
  try {
    const raw = localStorage.getItem(TIPS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}
const shownTips = loadShownTips()
function saveShownTips() {
  try { localStorage.setItem(TIPS_KEY, JSON.stringify([...shownTips])) } catch {}
}

export function useFlui() {
  const { fluiPresence, fluiConsejos, fluiCelebra } = useTheme()

  /** Briefly react, then fall back to `vuelta` (default 'idle') — unless a
   * fijar() is active, in which case the reaction still shows but the
   * fallback respects the fijado state instead of clobbering it. */
  function reaccionar(nuevo: FluiState, ms = 1300, vuelta: FluiState = 'idle') {
    if (nuevo === 'celebra' && !fluiCelebra.value) nuevo = 'feliz'
    estado.value = nuevo
    if (revertTimer) clearTimeout(revertTimer)
    revertTimer = setTimeout(() => { if (!fijado) estado.value = vuelta }, ms)
  }

  /** Pin a state with no auto-revert — used while a focus session is
   * running ('enfoque') or after the day closes ('dormido'). Call
   * fijar(null) to release back to 'idle'. */
  function fijar(nuevo: FluiState | null) {
    fijado = nuevo !== null
    if (revertTimer) { clearTimeout(revertTimer); revertTimer = null }
    estado.value = nuevo ?? 'idle'
  }

  /** Show a one-time tip for a given screen key — never repeats once seen,
   * matching the source document's "1 por pantalla" rule. No-ops if the
   * user turned tips off in Settings. */
  function consejo(pantalla: string, texto: string) {
    if (!fluiConsejos.value || shownTips.has(pantalla)) return
    shownTips.add(pantalla)
    saveShownTips()
    consejoTexto.value = texto
    reaccionar('pista', 6000)
  }

  return { estado, consejoTexto, presencia: fluiPresence, reaccionar, fijar, consejo }
}
