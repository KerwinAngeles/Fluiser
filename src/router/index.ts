import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: () => import('@/views/LandingView.vue') },
    { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/habits', name: 'habits', component: () => import('@/views/HabitsView.vue'), meta: { requiresAuth: true } },
    { path: '/habits/new', name: 'habit-new', component: () => import('@/views/HabitEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/habits/:id/edit', name: 'habit-edit', component: () => import('@/views/HabitEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/heatmap', name: 'heatmap', component: () => import('@/views/HeatmapView.vue'), meta: { requiresAuth: true } },
    { path: '/goals', name: 'goals', component: () => import('@/views/GoalsView.vue'), meta: { requiresAuth: true } },
    { path: '/goals/new', name: 'meta-new', component: () => import('@/views/MetaEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/goals/:id/edit', name: 'meta-edit', component: () => import('@/views/MetaEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/flow', name: 'flow', component: () => import('@/views/FlowJournalView.vue'), meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) return '/auth'
  if ((to.path === '/auth' || to.path === '/') && auth.user) return '/dashboard'
})

export default router
