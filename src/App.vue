<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { provideLang } from '@/composables/useLang'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBackground from '@/components/ui/AppBackground.vue'
import TimerView from '@/views/TimerView.vue'
import FocusModeView from '@/views/FocusModeView.vue'
import { RouterView } from 'vue-router'

const store     = useFluiserStore()
const authStore = useAuthStore()
const router    = useRouter()
const { lang }  = useTheme()

provideLang(lang)

watch(() => authStore.user, async (user, prev) => {
  if (user && !prev) {
    const path = router.currentRoute.value.path
    if (path === '/auth' || path === '/') router.push('/dashboard')
    await store.init(user.id)
  } else if (!user && prev) {
    store.reset()
  }
}, { immediate: false })

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'f' || e.key === 'F') {
    if (!store.activeTimer) store.data.focusOn = !store.data.focusOn
    return
  }
  if (e.key === 'Escape') {
    if (store.data.focusOn) store.data.focusOn = false
    return
  }
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

const mainRef = ref<HTMLElement | null>(null)
function scrollToTop() { mainRef.value?.scrollTo(0, 0) }

const gateKey = computed(() => {
  if (store.activeTimer) return 'timer'
  if (store.data.focusOn) return 'focus'
  return 'app'
})

const outerGate = computed(() => {
  if (authStore.loading || (!!authStore.user && store.loading)) return 'loading'
  if (!authStore.user) return 'auth'
  return 'ready'
})
</script>

<template>
  <AppBackground />

  <Transition name="outer-gate" mode="out-in">

    <!-- Branded loader (auth check or data fetch) -->
    <div v-if="outerGate === 'loading'" key="loading" class="brand-loader">
      <div class="bl-mark">
        <span class="bl-symbol">✦</span>
      </div>
      <div class="bl-bar">
        <div class="bl-bar-fill" />
      </div>
    </div>

    <!-- Login page -->
    <div v-else-if="outerGate === 'auth'" key="auth" class="full-shell">
      <RouterView />
    </div>

    <!-- Authenticated app -->
    <div v-else key="ready" class="full-shell">
      <Transition name="gate" mode="out-in">
        <TimerView v-if="gateKey === 'timer'" key="timer" />
        <FocusModeView v-else-if="gateKey === 'focus'" key="focus" @exit="store.data.focusOn = false" />
        <div v-else key="app" class="app">
          <AppSidebar />
          <main ref="mainRef" class="main">
            <RouterView v-slot="{ Component, route }">
              <Transition name="page" mode="out-in" @after-leave="scrollToTop">
                <component :is="Component" :key="route.path" />
              </Transition>
            </RouterView>
          </main>
        </div>
      </Transition>
    </div>

  </Transition>
</template>

<style scoped>
.full-shell {
  position: fixed;
  inset: 0;
}

/* Branded loader */
.brand-loader {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  background: var(--bg-base);
}
.bl-mark {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(140deg, var(--accent) 0%, var(--lilac) 100%);
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.10) inset, 0 12px 40px var(--accent-glow);
  animation: bl-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  position: relative;
  overflow: hidden;
}
.bl-mark::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.4), transparent 58%);
}
.bl-symbol {
  font-size: 28px;
  color: rgba(255,255,255,0.92);
  position: relative;
  z-index: 1;
}
.bl-bar {
  width: 80px;
  height: 2px;
  border-radius: 999px;
  background: var(--border-subtle);
  overflow: hidden;
}
.bl-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--lilac));
  animation: bl-progress 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes bl-pulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.10) inset, 0 12px 40px var(--accent-glow); }
  50%       { box-shadow: 0 0 0 1px rgba(255,255,255,0.10) inset, 0 16px 60px var(--accent-glow), 0 0 0 8px var(--accent-soft); }
}
@keyframes bl-progress {
  0%   { transform: translateX(-100%); }
  50%  { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

/* Outer gate (auth ↔ app) transitions */
.outer-gate-enter-active {
  animation: outer-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.outer-gate-leave-active {
  animation: outer-out 260ms cubic-bezier(0.32, 0, 0.67, 0) both;
  pointer-events: none;
}
@keyframes outer-in  { from { opacity: 0; transform: scale(0.97) translateY(10px); } }
@keyframes outer-out { to   { opacity: 0; transform: scale(1.02); } }
</style>
