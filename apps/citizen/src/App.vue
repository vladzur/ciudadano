<script setup lang="ts">
import { useCitizenAuth } from "./composables/useCitizenAuth";

const { loading } = useCitizenAuth();
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-screen bg-green-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mx-auto mb-4" />
      <p class="text-gray-600 text-sm">Cargando...</p>
    </div>
  </div>
  <router-view v-else />
</template>
