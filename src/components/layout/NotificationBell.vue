<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useT, useLang } from '@/composables/useLang'
import { timeAgo } from '@/composables/useDateUtils'
import { useNotifications } from '@/composables/useNotifications'
import { BellIcon } from '@/components/icons/AppIcons'
import type { AppNotification } from '@/types'

const router = useRouter()
const t = useT()
const lang = useLang()
const { items, unreadCount, markRead, markAllRead } = useNotifications()

const open = ref(false)
const triggerEl = ref<HTMLButtonElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<{ top: string; right: string }>({ top: '0px', right: '0px' })

function updatePosition() {
  if (!triggerEl.value) return
  const r = triggerEl.value.getBoundingClientRect()
  panelStyle.value = { top: `${r.bottom + 10}px`, right: `${window.innerWidth - r.right}px` }
}

function toggle() {
  open.value = !open.value
  if (open.value) updatePosition()
}

async function onItemClick(n: AppNotification) {
  await markRead(n.id)
  open.value = false
  if (n.url) router.push(n.url)
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (triggerEl.value?.contains(target)) return
  if (panelEl.value?.contains(target)) return
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside, true)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', updatePosition)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside, true)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div class="nb-root">
    <button
      ref="triggerEl"
      class="settings-btn nb-trigger"
      :class="{ 'nb-open': open }"
      :title="t('Notificaciones', 'Notifications')"
      @click="toggle"
    >
      <BellIcon :size="16" />
      <span v-if="unreadCount > 0" class="nb-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <Teleport to="body">
      <Transition name="nb-panel">
        <div v-if="open" ref="panelEl" class="nb-panel" :style="panelStyle">
          <div class="nb-header">
            <span class="nb-title">{{ t('Notificaciones', 'Notifications') }}</span>
            <button v-if="unreadCount > 0" class="nb-mark-all" @click="markAllRead">
              {{ t('Marcar todas como leídas', 'Mark all as read') }}
            </button>
          </div>

          <div v-if="items.length === 0" class="nb-empty">
            <BellIcon :size="22" />
            <p>{{ t('No tienes notificaciones', "You're all caught up") }}</p>
          </div>

          <div v-else class="nb-list">
            <button
              v-for="n in items" :key="n.id"
              class="nb-item"
              :class="{ unread: !n.read }"
              @click="onItemClick(n)"
            >
              <span class="nb-dot" />
              <span class="nb-body">
                <span class="nb-item-title">{{ n.title }}</span>
                <span class="nb-item-text">{{ n.body }}</span>
                <span class="nb-item-time">{{ timeAgo(n.createdAt, lang) }}</span>
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.nb-root { position: relative; }

.nb-trigger { position: relative; }
.nb-trigger.nb-open { background: var(--border-subtle); color: var(--text-1); }

.nb-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--rose);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
  box-shadow: 0 0 0 2px var(--bg-elevated, #0F1115);
}

.nb-panel {
  position: fixed;
  width: min(340px, 88vw);
  max-height: min(420px, 70vh);
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
  overflow: hidden;
  z-index: 200;
}

.nb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.nb-title { font-size: 13px; font-weight: 600; color: var(--text-1); }
.nb-mark-all {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}
.nb-mark-all:hover { text-decoration: underline; }

.nb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 20px;
  color: var(--text-3);
}
.nb-empty p { font-size: 12.5px; margin: 0; }

.nb-list {
  overflow-y: auto;
  padding: 6px;
}

.nb-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 9px 8px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background 140ms ease;
}
.nb-item:hover { background: var(--border-subtle); }

.nb-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  background: transparent;
}
.nb-item.unread .nb-dot { background: var(--accent); }

.nb-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.nb-item-title { font-size: 12.5px; font-weight: 500; color: var(--text-2); }
.nb-item.unread .nb-item-title { font-weight: 700; color: var(--text-1); }
.nb-item-text {
  font-size: 12px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.nb-item-time { font-size: 10.5px; color: var(--text-4, var(--text-3)); margin-top: 1px; }

.nb-panel-enter-active { animation: nb-in 160ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.nb-panel-leave-active { animation: nb-in 120ms ease reverse both; }
@keyframes nb-in {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
}
</style>
