import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { loadNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/supabase'
import type { AppNotification } from '@/types'

const isDemo = () => localStorage.getItem('fluiser_demo_mode') === 'true'
const POLL_MS = 60_000

export function useNotifications() {
  const auth = useAuthStore()
  const items = ref<AppNotification[]>([])
  const loading = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

  async function refresh() {
    if (isDemo() || !auth.user) return
    loading.value = true
    items.value = await loadNotifications(auth.user.id)
    loading.value = false
  }

  async function markRead(id: string) {
    const n = items.value.find((x) => x.id === id)
    if (!n || n.read || !auth.user) return
    n.read = true
    await markNotificationRead(auth.user.id, id)
  }

  async function markAllRead() {
    if (!auth.user || unreadCount.value === 0) return
    items.value.forEach((n) => { n.read = true })
    await markAllNotificationsRead(auth.user.id)
  }

  function onVisible() {
    if (document.visibilityState === 'visible') refresh()
  }

  onMounted(() => {
    refresh()
    timer = setInterval(refresh, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { items, loading, unreadCount, refresh, markRead, markAllRead }
}
