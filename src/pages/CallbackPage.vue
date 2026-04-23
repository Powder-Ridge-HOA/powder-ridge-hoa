<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { handleRedirectCallback, logout } = useAuth0()
const { isAuthenticated, isMember } = useAuth()

const errorMessage = ref<string | null>(null)

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'referrer', content: 'no-referrer' },
  ],
})

function consumeTargetUrl(): string {
  try {
    const target = sessionStorage.getItem('auth:targetUrl')
    if (target) {
      sessionStorage.removeItem('auth:targetUrl')
      return target
    }
  } catch { /* storage disabled */ }
  return '/'
}

onMounted(async () => {
  try {
    const result = await handleRedirectCallback()

    if (!isAuthenticated.value) {
      errorMessage.value = 'Token exchange completed but not authenticated. Check Auth0 app settings.'
      return
    }
    if (!isMember.value) {
      router.replace('/unauthorized')
      return
    }

    const fromAppState = (result?.appState as { targetUrl?: string } | undefined)?.targetUrl
    const target = fromAppState || consumeTargetUrl()
    router.replace(target)
  } catch (err) {
    // Do NOT redirect to /login on failure — that page calls loginWithRedirect,
    // which bounces back here and loops infinitely. Show the error instead.
    console.error('Auth0 callback failed:', err)
    errorMessage.value = err instanceof Error ? err.message : String(err)
  }
})

function handleReset() {
  try { sessionStorage.clear() } catch { /* empty */ }
  try { localStorage.clear() } catch { /* empty */ }
  logout({ logoutParams: { returnTo: window.location.origin } })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div v-if="errorMessage" class="max-w-xl text-center space-y-4">
      <h1 class="text-2xl font-bold text-[var(--color-text)]">Login Error</h1>
      <p class="text-[var(--color-text-secondary)] text-sm">The Auth0 callback failed. Error:</p>
      <pre class="text-left text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 overflow-auto whitespace-pre-wrap">{{ errorMessage }}</pre>
      <button
        type="button"
        class="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90"
        @click="handleReset"
      >
        Clear session and retry
      </button>
    </div>
    <p v-else class="text-gray-500 text-sm">Completing login…</p>
  </div>
</template>
