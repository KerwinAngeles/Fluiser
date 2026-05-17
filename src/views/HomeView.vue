<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
    <h1 class="text-4xl font-bold tracking-tight">Molde Vue 3</h1>
    <p class="text-gray-500">Punto de partida para tus proyectos frontend.</p>

    <div class="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p class="text-sm text-gray-500">Ejemplo de Pinia store</p>
      <p class="text-2xl font-semibold">{{ counter.count }}</p>
      <p class="text-sm text-gray-400">doble: {{ counter.doubleCount }}</p>
      <button
        class="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
        @click="counter.increment"
      >
        Incrementar
      </button>
    </div>

    <RouterLink class="text-sm text-blue-500 hover:underline" to="/about">
      Ir a About →
    </RouterLink>
  </main>
</template>
