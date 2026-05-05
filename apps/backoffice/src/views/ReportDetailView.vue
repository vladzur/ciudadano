<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useReportsStore } from "../stores/reports";
import { getSignedUrl } from "../services/api";
import StatusBadge from "../components/StatusBadge.vue";
import NotesTimeline from "../components/NotesTimeline.vue";

const route = useRoute();
const router = useRouter();
const store = useReportsStore();

const imageUrl = ref<string | null>(null);
const loadingImage = ref(false);
const newNote = ref("");
const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En Gestión" },
  { value: "resolved", label: "Resuelto" },
];

onMounted(async () => {
  const id = route.params.id as string;
  await store.loadReportDetail(id);

  // Cargar imagen con signed URL si existe
  if (store.selectedReport?.image_url) {
    loadingImage.value = true;
    try {
      imageUrl.value = await getSignedUrl(store.selectedReport.image_url);
    } catch {
      // Imagen no disponible
    } finally {
      loadingImage.value = false;
    }
  }
});

async function handleStatusChange(status: string) {
  await store.changeStatus(route.params.id as string, status);
}

async function addNote() {
  if (!newNote.value.trim()) return;
  await store.addNote(route.params.id as string, newNote.value.trim());
  newNote.value = "";
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <button
      class="text-sm text-green-700 mb-4 flex items-center gap-1 hover:underline"
      @click="router.push('/reports')"
    >
      ← Volver a lista
    </button>

    <div v-if="store.loading" class="text-center py-8 text-gray-500 text-sm">
      Cargando denuncia...
    </div>

    <div v-if="store.error" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
      {{ store.error }}
    </div>

    <template v-if="store.selectedReport">
      <!-- Detalle principal -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-800">
              {{ store.selectedReport.category }}
            </h2>
            <p class="text-xs text-gray-500 mt-1">
              ID: {{ store.selectedReport.id }}
            </p>
          </div>
          <StatusBadge :status="store.selectedReport.status" />
        </div>

        <p class="text-gray-700 mb-4">{{ store.selectedReport.description }}</p>

        <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <span class="font-medium">Ubicación:</span>
            {{ store.selectedReport.location.lat.toFixed(4) }},
            {{ store.selectedReport.location.lng.toFixed(4) }}
          </div>
          <div>
            <span class="font-medium">Fecha:</span>
            {{ new Date(store.selectedReport.created_at).toLocaleDateString("es-CL") }}
          </div>
        </div>

        <!-- Imagen -->
        <div v-if="store.selectedReport.image_url" class="mt-4">
          <p class="text-sm font-medium text-gray-600 mb-2">Evidencia fotográfica</p>
          <div v-if="loadingImage" class="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded-xl">
            Cargando imagen...
          </div>
          <img
            v-else-if="imageUrl"
            :src="imageUrl"
            alt="Evidencia"
            class="max-w-full max-h-96 rounded-xl object-cover"
          />
          <p v-else class="text-sm text-red-500">Imagen no disponible (URL expirada)</p>
        </div>
      </div>

      <!-- Cambio de estado -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Cambiar Estado</h3>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-colors border"
            :class="[
              store.selectedReport.status === opt.value
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-300',
            ]"
            @click="handleStatusChange(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Notas internas -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Notas de Seguimiento</h3>

        <!-- Formulario para añadir nota -->
        <div class="flex gap-2 mb-4">
          <input
            v-model="newNote"
            type="text"
            class="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Añadir nota de seguimiento..."
            @keyup.enter="addNote"
          />
          <button
            class="bg-green-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
            :disabled="!newNote.trim()"
            @click="addNote"
          >
            Agregar
          </button>
        </div>

        <NotesTimeline :notes="store.selectedReport.notes ?? []" />
      </div>
    </template>
  </div>
</template>
