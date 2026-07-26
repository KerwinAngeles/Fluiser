import { ref } from 'vue'

function ymdNow(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Module-level singleton — one interval, one listener, shared across all consumers
export const todayRef = ref(ymdNow())
const _hour = ref(new Date().getHours())

function _refresh() {
  todayRef.value = ymdNow()
  _hour.value = new Date().getHours()
}

setInterval(_refresh, 60_000)

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') _refresh()
  })
}

export function useToday() {
  return { today: todayRef, hour: _hour }
}
