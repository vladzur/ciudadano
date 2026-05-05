<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-700 to-green-900 flex flex-col items-center justify-center px-6 text-center">
    <!-- Ícono de éxito -->
    <div class="bg-white rounded-full p-6 mb-8 shadow-lg">
      <svg
        class="w-16 h-16 text-green-600"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>

    <h2 class="text-2xl font-bold text-white mb-3">
      ¡Denuncia enviada!
    </h2>
    <p class="text-green-200 mb-8 max-w-xs">
      Tu reporte ha sido registrado exitosamente. El equipo municipal lo revisará a la brevedad.
    </p>

    <button
      class="bg-white text-green-800 font-semibold px-8 py-3 rounded-xl shadow-lg hover:bg-green-50 transition-colors"
      @click="router.push('/')"
    >
      Hacer otra denuncia
    </button>
  </div>
</template>
