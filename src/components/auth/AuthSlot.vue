<script setup lang="ts">
import { useAuth } from '../../composables/useAuth'

const { isAuthenticated, isLoading, user, login, logout } = useAuth()
</script>

<template>
  <div v-if="!isLoading" class="flex items-center gap-2">
    <template v-if="isAuthenticated">
      <span class="text-sm text-gray-600 hidden sm:inline">{{ user?.name || user?.email }}</span>
      <button
        @click="logout()"
        class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        Log Out
      </button>
    </template>
    <template v-else>
      <button
        @click="login()"
        class="text-sm px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        Log In
      </button>
    </template>
  </div>
</template>
