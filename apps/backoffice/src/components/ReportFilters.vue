<script setup lang="ts">
import { ref } from "vue";
import { CATEGORIES } from "@ciudadano/shared";

const emit = defineEmits<{
  filter: [params: { status?: string; category?: string }];
}>();

const selectedStatus = ref("");
const selectedCategory = ref("");

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "in_progress", label: "En Gestión" },
  { value: "resolved", label: "Resueltos" },
];

function applyFilter() {
  emit("filter", {
    status: selectedStatus.value || undefined,
    category: selectedCategory.value || undefined,
  });
}

function clearFilters() {
  selectedStatus.value = "";
  selectedCategory.value = "";
  emit("filter", {});
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
    <div class="flex flex-wrap items-end gap-3">
      <!-- Filtro por estado -->
      <div class="flex-1 min-w-[150px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Estado</label>
        <select
          v-model="selectedStatus"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          @change="applyFilter"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Filtro por categoría -->
      <div class="flex-1 min-w-[150px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
        <select
          v-model="selectedCategory"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          @change="applyFilter"
        >
          <option value="">Todas las categorías</option>
          <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>

      <!-- Limpiar filtros -->
      <button
        class="text-sm text-gray-500 hover:text-gray-700 underline px-2 py-2"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>
    </div>
  </div>
</template>
