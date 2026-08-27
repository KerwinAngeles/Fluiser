import { ref, watch } from 'vue'

const KEY = 'fluiser_sidebar_collapsed'
const SIDEBAR_W = '240px'
const SIDEBAR_W_COLLAPSED = '76px'

// Module-level shared state (same pattern as useConfirm.ts) — the sidebar
// width lives on :root as a CSS var so the .app grid column and the sidebar
// itself agree without prop-drilling through App.vue.
const collapsed = ref(localStorage.getItem(KEY) === 'true')

function apply(value: boolean) {
  document.documentElement.style.setProperty('--shell-sidebar-w', value ? SIDEBAR_W_COLLAPSED : SIDEBAR_W)
}
apply(collapsed.value)

watch(collapsed, (value) => {
  apply(value)
  try { localStorage.setItem(KEY, String(value)) } catch { /* ignore */ }
})

export function useSidebarCollapsed() {
  return { collapsed, toggle: () => { collapsed.value = !collapsed.value } }
}
