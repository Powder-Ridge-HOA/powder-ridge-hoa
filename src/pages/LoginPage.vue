<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated, login } = useAuth()

onMounted(() => {
  if (isAuthenticated.value) {
    router.replace('/')
  } else {
    login(router.currentRoute.value.query.redirect as string || '/')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500 text-sm">Redirecting to login…</p>
  </div>
</template>
