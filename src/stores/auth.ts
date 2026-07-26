import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  async function init() {
    loading.value = true
    const isDemo = localStorage.getItem('fluiser_demo_mode') === 'true'
    if (isDemo) {
      user.value = {
        id: 'demo-user-id',
        email: 'demo@fluiser.app',
        user_metadata: {
          fluiser_name: 'Usuario Demo',
          full_name: 'Usuario Demo',
        },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      } as any
      session.value = {
        access_token: 'demo-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'demo-refresh',
        user: user.value,
      } as Session
      loading.value = false
      return
    }

    // During an OAuth PKCE callback, the URL contains ?code=… and the first
    // onAuthStateChange fires as INITIAL_SESSION with a null session (before
    // the code exchange finishes). Skip that null fire so we don't resolve early
    // and redirect the user back to /auth before SIGNED_IN arrives.
    const isOAuthCallback = window.location.search.includes('code=')
    return new Promise<void>((resolve) => {
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        if (loading.value) {
          if (isOAuthCallback && _event === 'INITIAL_SESSION' && !newSession) return
          loading.value = false
          resolve()
        }
      })
    })
  }

  async function signInWithGoogle() {
    localStorage.removeItem('fluiser_demo_mode')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signInWithGitHub() {
    localStorage.removeItem('fluiser_demo_mode')
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signInDemo() {
    loading.value = true
    localStorage.setItem('fluiser_demo_mode', 'true')
    user.value = {
      id: 'demo-user-id',
      email: 'demo@fluiser.app',
      user_metadata: {
        fluiser_name: 'Usuario Demo',
        full_name: 'Usuario Demo',
      },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
    } as any
    session.value = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: user.value,
    } as Session
    loading.value = false
    await router.push('/dashboard')
  }

  async function signOut() {
    localStorage.removeItem('fluiser_demo_mode')
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    router.push('/auth')
  }

  return { user, session, loading, init, signInWithGoogle, signInWithGitHub, signInDemo, signOut }
})
