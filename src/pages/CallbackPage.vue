<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated, isLoading, isMember } = useAuth()

watch(isLoading, (loading) => {
  if (loading) return
  if (isAuthenticated.value && isMember.value) {
    const target = (router.currentRoute.value.query.targetUrl as string) || '/'
    router.replace(target)
  } else if (isAuthenticated.value) {
    router.replace('/unauthorized')
  } else {
    router.replace('/login')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500 text-sm">Completing login…</p>
  </div>
</template>
