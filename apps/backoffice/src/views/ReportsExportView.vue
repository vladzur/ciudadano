<script setup lang="ts">
import { ref } from "vue";

const loading = ref(false);
const error = ref<string | null>(null);
const startDate = ref("");
const endDate = ref("");
const format = ref<"pdf" | "excel">("pdf");

/** Descarga archivo de exportación desde la API */
async function exportReport() {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem("accessToken");
    const params = new URLSearchParams();
    if (startDate.value) params.append("startDate", startDate.value);
    if (endDate.value) params.append("endDate", endDate.value);

    const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
    const url = `${baseUrl}/reports/export/${format.value}?${params.toString()}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Error al generar el reporte (${response.status})`);
    }

    const blob = await response.blob();
    const ext = format.value === "pdf" ? "pdf" : "xlsx";
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `reporte-gestion-villarrica.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Error al exportar reporte.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <h2 class="text-xl font-bold text-gray-800 mb-6">Generar Reporte de Gestión</h2>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p class="text-sm text-gray-600 mb-6">
        Genere un reporte mensual en PDF o Excel para presentar en sesiones del Concejo Municipal.
      </p>

      <!-- Rango de fechas -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            v-model="endDate"
            type="date"
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
      </div>

      <!-- Selección de formato -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Formato</label>
        <div class="flex gap-3">
          <label
            class="flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer transition-colors"
            :class="[
              format === 'pdf'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300',
            ]"
          >
            <input
              v-model="format"
              type="radio"
              value="pdf"
              class="hidden"
            />
            <span class="text-sm font-medium text-gray-700">PDF</span>
          </label>
          <label
            class="flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer transition-colors"
            :class="[
              format === 'excel'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300',
            ]"
          >
            <input
              v-model="format"
              type="radio"
              value="excel"
              class="hidden"
            />
            <span class="text-sm font-medium text-gray-700">Excel</span>
          </label>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4"
      >
        {{ error }}
      </div>

      <!-- Botón de exportación -->
      <button
        class="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        :disabled="loading"
        @click="exportReport"
      >
        <svg
          v-if="loading"
          class="animate-spin w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ loading ? "Generando..." : `Descargar ${format.toUpperCase()}` }}
      </button>
    </div>
  </div>
</template>
