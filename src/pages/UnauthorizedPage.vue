<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="max-w-md w-full text-center space-y-4">
      <h1 class="text-2xl font-bold text-gray-900">Access Restricted</h1>
      <p class="text-gray-600">
        Welcome, {{ user?.name || user?.email }}! Your account isn't currently
        authorized to view this section of <strong>Powder Ridge HOA</strong>.
      </p>
      <p class="text-gray-500 text-sm">
        If you believe this is an error, please contact
        <a href="mailto:powderridgesecretary@gmail.com" class="underline">powderridgesecretary@gmail.com</a>
        to be added.
      </p>
      <button
        @click="logout()"
        class="mt-4 px-6 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Log Out
      </button>
    </div>
  </div>
</template>
