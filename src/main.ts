import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

async function bootstrap() {
  const auth = useAuthStore()
  // Mount before auth resolves so the brand-loader is visible during the wait.
  // The watch in App.vue handles the router redirect and fluiser.init() once
  // the user is authenticated.
  await router.isReady()
  app.mount('#app')
  await auth.init()
}

bootstrap()
