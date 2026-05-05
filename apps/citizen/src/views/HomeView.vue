<script setup lang="ts">
import ReportForm from "../components/ReportForm.vue";
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-700 to-green-900">
    <!-- Header -->
    <header class="px-4 pt-12 pb-6 text-center text-white">
      <h1 class="text-2xl font-bold tracking-tight">
        Denuncia Ciudadana
      </h1>
      <p class="mt-1 text-sm text-green-200">
        Villarrica
      </p>
      <p class="mt-3 text-xs text-green-300 max-w-xs mx-auto">
        Reporta incidentes urbanos y ayuda a mejorar tu comuna
      </p>
    </header>

    <!-- Formulario -->
    <main class="px-4 pb-8">
      <ReportForm />
    </main>
  </div>
</template>
