<script setup lang="ts">
defineProps<{
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="mb-4 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
    <!-- Ícono de ubicación -->
    <div
      class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
      :class="[
        latitude
          ? 'bg-green-100 text-green-700'
          : error
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-200 text-gray-500',
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    </div>

    <!-- Estado -->
    <div class="flex-1 min-w-0">
      <template v-if="loading">
        <p class="text-sm text-gray-500">Obteniendo ubicación...</p>
        <div class="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-green-500 animate-pulse rounded-full w-2/3" />
        </div>
      </template>
      <template v-else-if="latitude">
        <p class="text-sm font-medium text-gray-700">Ubicación obtenida</p>
        <p class="text-xs text-gray-500 truncate">
          {{ latitude.toFixed(4) }}, {{ longitude!.toFixed(4) }}
        </p>
      </template>
      <template v-else>
        <p class="text-sm text-red-600">{{ error ?? "Sin ubicación" }}</p>
      </template>
    </div>

    <!-- Botón de reintento -->
    <button
      v-if="error"
      class="flex-shrink-0 text-xs text-green-700 font-medium hover:underline"
      @click="$emit('retry')"
    >
      Reintentar
    </button>
  </div>
</template>
