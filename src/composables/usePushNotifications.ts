import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { savePushSubscription, deletePushSubscription } from '@/services/supabase'

const isDemo = () => localStorage.getItem('fluiser_demo_mode') === 'true'

function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const raw = atob(base64url.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  const subscribed = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refreshState() {
    if (!isSupported || isDemo()) return
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    subscribed.value = !!existing && Notification.permission === 'granted'
  }

  async function enable() {
    if (!isSupported || isDemo()) return
    error.value = null
    loading.value = true
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        error.value = 'Permiso de notificaciones denegado.'
        return
      }

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
      if (!vapidPublicKey) {
        error.value = 'Falta configurar la clave VAPID.'
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }))

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        error.value = 'No hay sesión activa.'
        return
      }

      const keys = subscription.toJSON().keys
      await savePushSubscription(user.id, {
        endpoint: subscription.endpoint,
        p256dh: keys?.p256dh ?? '',
        authKey: keys?.auth ?? '',
      })
      subscribed.value = true
    } catch (err) {
      console.error('usePushNotifications.enable', err)
      error.value = 'No se pudo activar los recordatorios.'
    } finally {
      loading.value = false
    }
  }

  async function disable() {
    if (!isSupported || isDemo()) return
    loading.value = true
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await deletePushSubscription(subscription.endpoint)
        await subscription.unsubscribe()
      }
      subscribed.value = false
    } catch (err) {
      console.error('usePushNotifications.disable', err)
      error.value = 'No se pudo desactivar los recordatorios.'
    } finally {
      loading.value = false
    }
  }

  async function toggle(next: boolean) {
    if (next) await enable()
    else await disable()
  }

  onMounted(refreshState)

  return { isSupported, subscribed, loading, error, toggle }
}
