import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },
    { path: '/', name: 'home', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/dashboard', redirect: '/' },
    { path: '/habits', name: 'habits', component: () => import('@/views/HabitsView.vue'), meta: { requiresAuth: true } },
    { path: '/heatmap', name: 'heatmap', component: () => import('@/views/HeatmapView.vue'), meta: { requiresAuth: true } },
    { path: '/goals', name: 'goals', component: () => import('@/views/GoalsView.vue'), meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) return '/auth'
  if (to.path === '/auth' && auth.user) return '/'
})

export default router
