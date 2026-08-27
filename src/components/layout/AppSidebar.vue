<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFluiserStore } from '@/stores/fluiser'
import { useAuthStore } from '@/stores/auth'
import { useT } from '@/composables/useLang'
import { useTheme } from '@/composables/useTheme'
import { useToday } from '@/composables/useToday'
import { useSidebarCollapsed } from '@/composables/useSidebarCollapsed'
import { MONTHS_ES, MONTHS_EN } from '@/composables/useDateUtils'
import {
  HomeIcon, HabitsIcon, HeatmapIcon,
  GoalsIcon, FocusIcon, TimelineIcon, SettingsIcon, SunIcon, MoonIcon, ChevronIcon,
} from '@/components/icons/AppIcons'
import NotificationBell from '@/components/layout/NotificationBell.vue'

const router = useRouter()
const route = useRoute()
const store = useFluiserStore()
const authStore = useAuthStore()
const t = useT()
const { lang, dark } = useTheme()
const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed()

const showLogoutModal = ref(false)
const signingOut = ref(false)

const { today } = useToday()
const todayDate = computed(() => new Date(today.value + 'T00:00:00'))
const months = computed(() => lang.value === 'en' ? MONTHS_EN : MONTHS_ES)
const dateLabel = computed(() => `${todayDate.value.getDate()} ${months.value[todayDate.value.getMonth()].slice(0, 3)}`)
const userName = computed(() => store.data.settings?.name || authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || '')
const userEmail = computed(() => authStore.user?.email ?? '')
const avatarLetter = computed(() => userName.value ? userName.value[0].toUpperCase() : 'U')

async function confirmSignOut() {
  signingOut.value = true
  await authStore.signOut()
  signingOut.value = false
  showLogoutModal.value = false
}

const navItems = computed(() => [
  { id: 'dashboard', label: t('Hoy', 'Today'),                icon: HomeIcon   },
  { id: 'habits',    label: t('Hábitos', 'Habits'),           icon: HabitsIcon },
  { id: 'heatmap',   label: t('Consistencia', 'Consistency'), icon: HeatmapIcon },
  { id: 'goals',     label: t('Metas', 'Goals'),              icon: GoalsIcon  },
  { id: 'flow',      label: t('Flujo', 'Flow'),               icon: TimelineIcon },
])

function isActive(id: string) {
  return route.path.startsWith(`/${id}`)
}
</script>

<template>
  <!-- ============== Desktop sidebar (≥960px) ============== -->
  <aside class="shell-sidebar" :class="{ collapsed }">
    <div class="shell-sidebar-head">
      <div class="brand">
        <div class="brand-mark-wrap">
          <div class="brand-mark-glow" />
          <div class="brand-mark">
            <span class="brand-symbol">✦</span>
          </div>
        </div>
        <div v-if="!collapsed" class="brand-text">
          <div class="brand-name">Fluiser</div>
          <div class="brand-date tnum">{{ dateLabel }}</div>
        </div>
      </div>
    </div>

    <nav class="shell-nav">
      <div
        v-for="n in navItems" :key="n.id"
        :class="['shell-nav-item', isActive(n.id) ? 'active' : '']"
        :title="collapsed ? n.label : undefined"
        @click="router.push(`/${n.id}`)"
      >
        <component :is="n.icon" class="icon" />
        <span v-if="!collapsed" class="shell-nav-label">{{ n.label }}</span>
      </div>
      <div class="shell-nav-sep" />
      <div class="shell-nav-item" :title="collapsed ? t('Enfoque', 'Focus') : undefined" @click="store.setFocus(true)">
        <FocusIcon class="icon" />
        <span v-if="!collapsed" class="shell-nav-label">{{ t('Enfoque', 'Focus') }}</span>
      </div>
    </nav>

    <div class="shell-spacer" />

    <div class="shell-sidebar-foot">
      <!-- Identity -->
      <div class="user-chip" @click="router.push('/settings')">
        <div class="avatar">{{ avatarLetter }}</div>
        <span v-if="!collapsed" class="user-name">{{ userName || userEmail }}</span>
      </div>

      <!-- Utilities — one row, consistent rhythm -->
      <div class="shell-foot-row">
        <button
          class="tc-btn"
          :title="dark ? t('Modo claro', 'Light mode') : t('Modo oscuro', 'Dark mode')"
          @click="dark = !dark"
        >
          <Transition name="tc-icon" mode="out-in">
            <SunIcon v-if="dark" :key="'sun'" :size="16" />
            <MoonIcon v-else :key="'moon'" :size="16" />
          </Transition>
        </button>
        <button class="tc-btn tc-lang" @click="lang = lang === 'es' ? 'en' : 'es'">
          {{ lang === 'es' ? 'EN' : 'ES' }}
        </button>
        <NotificationBell />
        <button
          :class="['settings-btn', route.path === '/settings' ? 'active' : '']"
          :title="t('Configuración', 'Settings')"
          @click="router.push('/settings')"
        >
          <SettingsIcon :size="16" />
        </button>
        <button class="logout-btn" :title="t('Cerrar sesión', 'Sign out')" @click="showLogoutModal = true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>

      <!-- Collapse — its own row, so it reads as a deliberate footer action
           instead of a chevron stranded at the far edge of another row. -->
      <button class="shell-collapse-btn" :title="collapsed ? t('Expandir', 'Expand') : t('Colapsar', 'Collapse')" @click="toggleCollapsed">
        <ChevronIcon :size="13" :style="{ transform: collapsed ? 'rotate(180deg)' : 'none' }" />
        <span v-if="!collapsed">{{ t('Colapsar', 'Collapse') }}</span>
      </button>
    </div>
  </aside>

  <!-- ============== Mobile top bar (<960px) — utilities only, no primary nav ============== -->
  <header class="shell-topbar">
    <div class="brand">
      <div class="brand-mark-wrap">
        <div class="brand-mark-glow" />
        <div class="brand-mark">
          <span class="brand-symbol">✦</span>
        </div>
      </div>
      <div class="brand-name">Fluiser</div>
    </div>
    <div class="shell-spacer" />
    <button
      class="tc-btn"
      :title="dark ? t('Modo claro', 'Light mode') : t('Modo oscuro', 'Dark mode')"
      @click="dark = !dark"
    >
      <Transition name="tc-icon" mode="out-in">
        <SunIcon v-if="dark" :key="'sun'" :size="16" />
        <MoonIcon v-else :key="'moon'" :size="16" />
      </Transition>
    </button>
    <NotificationBell />
    <button
      :class="['settings-btn', route.path === '/settings' ? 'active' : '']"
      :title="t('Configuración', 'Settings')"
      @click="router.push('/settings')"
    >
      <SettingsIcon :size="16" />
    </button>
    <button class="logout-btn" :title="t('Cerrar sesión', 'Sign out')" @click="showLogoutModal = true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
    </button>
  </header>

  <!-- ============== Mobile bottom tabs (<960px) — primary nav ============== -->
  <nav class="shell-tabbar">
    <button
      v-for="n in navItems" :key="n.id"
      :class="['shell-tab', isActive(n.id) ? 'active' : '']"
      @click="router.push(`/${n.id}`)"
    >
      <component :is="n.icon" class="icon" />
      <span>{{ n.label }}</span>
    </button>
    <button class="shell-tab" @click="store.setFocus(true)">
      <FocusIcon class="icon" />
      <span>{{ t('Enfoque', 'Focus') }}</span>
    </button>
  </nav>

  <!-- Logout confirmation modal -->
  <Teleport to="body">
    <Transition name="logout-scrim">
      <div v-if="showLogoutModal" class="logout-scrim" @click.self="showLogoutModal = false">
        <Transition name="logout-card" appear>
          <div v-if="showLogoutModal" class="logout-card">
            <div class="lc-avatar">{{ avatarLetter }}</div>
            <h2 class="lc-title">{{ t('¿Cerrar sesión?', 'Sign out?') }}</h2>
            <p class="lc-body">{{ t('Tus datos están guardados de forma segura. Podrás continuar desde donde lo dejaste cuando vuelvas.', 'Your data is safely saved. You can pick up right where you left off when you come back.') }}</p>
            <div class="lc-actions">
              <button class="btn btn-ghost lc-btn" :disabled="signingOut" @click="showLogoutModal = false">
                {{ t('Cancelar', 'Cancel') }}
              </button>
              <button class="btn lc-btn lc-danger" :disabled="signingOut" @click="confirmSignOut">
                <span v-if="signingOut" class="lc-spinner" />
                <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                {{ t('Cerrar sesión', 'Sign out') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.user-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-1);
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* icon swap animation */
.tc-icon-enter-active { animation: tc-pop 180ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.tc-icon-leave-active { animation: tc-pop 120ms ease reverse both; }
@keyframes tc-pop {
  from { opacity: 0; transform: scale(0.7) rotate(-15deg); }
}

/* ── Logout modal ── */
.logout-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 24px;
}
.logout-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  width: min(400px, 100%);
  padding: 36px 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
}
.lc-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--amber), var(--rose));
  font-size: 20px; font-weight: 600; color: rgba(255,255,255,0.9);
  display: grid; place-items: center;
  margin-bottom: 18px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.lc-title { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: var(--text-1); margin: 0 0 10px; }
.lc-body { font-size: 14px; color: var(--text-3); line-height: 1.6; margin: 0 0 28px; max-width: 300px; }
.lc-actions { display: flex; gap: 10px; width: 100%; }
.lc-btn { flex: 1; justify-content: center; height: 40px; font-size: 13.5px; font-weight: 500; }
.lc-danger {
  background: var(--rose-soft); color: var(--rose);
  border-color: rgba(232, 155, 149, 0.25); gap: 6px;
}
.lc-danger:hover:not(:disabled) { background: var(--rose); color: #fff; border-color: transparent; }
.lc-danger:disabled { opacity: 0.55; cursor: not-allowed; }
.lc-spinner {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: currentColor;
  border-radius: 50%; animation: lc-spin 0.6s linear infinite; flex-shrink: 0;
}
@keyframes lc-spin { to { transform: rotate(360deg); } }

.logout-scrim-enter-active { transition: opacity 220ms ease; }
.logout-scrim-leave-active { transition: opacity 180ms ease; }
.logout-scrim-enter-from, .logout-scrim-leave-to { opacity: 0; }

.logout-card-enter-active { animation: lc-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.logout-card-leave-active { animation: lc-out 180ms cubic-bezier(0.32, 0, 0.67, 0); }
@keyframes lc-in  { from { opacity: 0; transform: scale(0.92) translateY(10px); } }
@keyframes lc-out { to   { opacity: 0; transform: scale(0.96) translateY(4px); } }
</style>
