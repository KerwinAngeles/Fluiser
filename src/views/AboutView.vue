<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
    <h1 class="text-3xl font-bold">About</h1>
    <p class="text-gray-500">Esta vista se carga con lazy load (code splitting).</p>
    <RouterLink class="text-sm text-blue-500 hover:underline" to="/">← Volver</RouterLink>
  </main>
</template>
