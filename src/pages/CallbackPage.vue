<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { handleRedirectCallback } = useAuth0()
const { isAuthenticated, isMember } = useAuth()

function consumeTargetUrl(): string {
  try {
    const target = sessionStorage.getItem('auth:targetUrl')
    console.log('[CallbackPage] sessionStorage auth:targetUrl =', target, 'origin=', window.location.origin)
    if (target) {
      sessionStorage.removeItem('auth:targetUrl')
      return target
    }
  } catch (e) { console.warn('[CallbackPage] sessionStorage read failed', e) }
  return '/'
}

console.log('[CallbackPage] setup, URL =', window.location.href)

onMounted(async () => {
  try {
    // Manually exchange the ?code= for tokens. skipRedirectCallback in
    // main.ts prevents the SDK from doing this automatically (and from
    // clobbering our navigation with its URL-cleanup replaceState).
    const result = await handleRedirectCallback()
    console.log('[CallbackPage] handleRedirectCallback resolved', { appState: result?.appState })

    if (!isAuthenticated.value) {
      console.log('[CallbackPage] not authenticated — router.replace => /login')
      router.replace('/login')
      return
    }
    if (!isMember.value) {
      console.log('[CallbackPage] authenticated but not a member — router.replace => /unauthorized')
      router.replace('/unauthorized')
      return
    }

    const fromAppState = (result?.appState as { targetUrl?: string } | undefined)?.targetUrl
    const target = fromAppState || consumeTargetUrl()
    console.log('[CallbackPage] member — router.replace =>', target)
    router.replace(target)
  } catch (err) {
    console.error('[CallbackPage] handleRedirectCallback failed', err)
    router.replace('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500 text-sm">Completing login…</p>
  </div>
</template>
