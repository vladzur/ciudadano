<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useReportsStore } from "../stores/reports";
import StatusBadge from "../components/StatusBadge.vue";
import ReportFilters from "../components/ReportFilters.vue";

const store = useReportsStore();
const router = useRouter();

onMounted(async () => {
  await store.loadReports({ page: 1, limit: 20 });
});

function goToDetail(id: string) {
  router.push(`/reports/${id}`);
}

function handleFilter(params: { status?: string; category?: string }) {
  store.loadReports({
    page: 1,
    limit: 20,
    status: params.status as any,
    category: params.category,
  });
}

function changePage(newPage: number) {
  store.loadReports({ page: newPage, limit: 20 });
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">Denuncias Recibidas</h2>
      <span class="text-sm text-gray-500">{{ store.total }} resultados</span>
    </div>

    <!-- Filtros -->
    <ReportFilters @filter="handleFilter" />

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-8 text-gray-500 text-sm">
      Cargando denuncias...
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4"
    >
      {{ store.error }}
    </div>

    <!-- Tabla -->
    <div v-if="!store.loading" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Descripción</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="report in store.reports"
              :key="report.id"
              class="border-b border-gray-50 hover:bg-green-50/50 cursor-pointer transition-colors"
              @click="goToDetail(report.id)"
            >
              <td class="px-4 py-3">
                <span class="font-medium text-gray-800">{{ report.category }}</span>
              </td>
              <td class="px-4 py-3 text-gray-600 max-w-xs truncate hidden md:table-cell">
                {{ report.description }}
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="report.status" />
              </td>
              <td class="px-4 py-3 text-gray-500 hidden lg:table-cell">
                {{ new Date(report.created_at).toLocaleDateString("es-CL") }}
              </td>
            </tr>
            <tr v-if="store.reports.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                No se encontraron denuncias.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div
      v-if="store.totalPages > 1"
      class="flex items-center justify-center gap-2 mt-4"
    >
      <button
        v-for="p in store.totalPages"
        :key="p"
        class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
        :class="[
          p === store.page
            ? 'bg-green-600 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-green-50',
        ]"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>
