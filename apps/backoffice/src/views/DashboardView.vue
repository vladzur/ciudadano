<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useReportsStore } from "../stores/reports";
import { useHeatmap } from "../composables/useHeatmap";

const store = useReportsStore();
const { loading: mapLoading, error: mapError, loadHeatmapData, mapLoaded } = useHeatmap("heatmap-container");

onMounted(async () => {
  await store.loadStats();
});

/** Tarjetas de KPIs para el dashboard */
const kpiCards = computed(() => [
  {
    label: "Total Denuncias",
    value: store.stats?.total ?? 0,
    color: "bg-blue-500",
    icon: "📋",
  },
  {
    label: "Pendientes",
    value: store.stats?.pendingCount ?? 0,
    color: "bg-yellow-500",
    icon: "⏳",
  },
  {
    label: "En Gestión",
    value: store.stats?.inProgressCount ?? 0,
    color: "bg-orange-500",
    icon: "🔄",
  },
  {
    label: "Resueltas",
    value: store.stats?.resolvedCount ?? 0,
    color: "bg-green-500",
    icon: "✅",
  },
]);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <h2 class="text-xl font-bold text-gray-800 mb-6">Dashboard de Gestión</h2>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ card.icon }}</span>
          <div>
            <p class="text-xs text-gray-500">{{ card.label }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mapa de calor -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Mapa de Denuncias</h3>
        <div class="flex gap-2">
          <button
            class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
            @click="loadHeatmapData()"
          >
            Todas
          </button>
          <button
            class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
            @click="loadHeatmapData({ category: 'Seguridad' })"
          >
            Seguridad
          </button>
          <button
            class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
            @click="loadHeatmapData({ category: 'Baches' })"
          >
            Baches
          </button>
        </div>
      </div>

      <div v-if="mapError" class="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-3">
        {{ mapError }}
      </div>

      <div id="heatmap-container-wrapper" class="relative">
        <!-- Placeholder mientras el mapa no está listo -->
        <div
          v-if="!mapLoaded"
          class="absolute inset-0 z-10 w-full rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
          style="height: 500px"
        >
          {{ mapLoading ? "Cargando mapa..." : "Inicializando mapa..." }}
        </div>

        <div
          id="heatmap-container"
          class="w-full rounded-xl bg-gray-200"
          style="height: 500px"
        ></div>
      </div>
    </div>
  </div>
</template>
