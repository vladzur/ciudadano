<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

/** Helper para exponer URL en el template para vue-tsc */
const createObjectURL = (blob: Blob): string => URL.createObjectURL(blob);
import { useGeolocation } from "../composables/useGeolocation";
import { useCamera } from "../composables/useCamera";
import { useReport } from "../composables/useReport";
import { CATEGORIES } from "@ciudadano/shared";
import CameraCapture from "./CameraCapture.vue";
import CategorySelector from "./CategorySelector.vue";
import LocationDisplay from "./LocationDisplay.vue";

const router = useRouter();
const { latitude, longitude, error: geoError, loading: geoLoading, getPosition } = useGeolocation();
const { photoBlob, isActive: cameraActive, startCamera, capturePhoto, stopCamera } = useCamera();
const { loading: sending, error: sendError, send } = useReport();

// Estado del formulario
const step = ref<"category" | "details" | "review">("category");
const selectedCategory = ref<string>("");
const description = ref("");
const photoFile = ref<File | null>(null);
const showCamera = ref(false);

const canProceed = computed(() => {
  if (step.value === "category") return selectedCategory.value !== "";
  if (step.value === "details") return description.value.length >= 10;
  return true;
});

function selectCategory(value: string) {
  selectedCategory.value = value;
  step.value = "details";
}

function handlePhoto(file: File) {
  photoFile.value = file;
  showCamera.value = false;
}

async function handleSubmit() {
  if (!latitude.value || !longitude.value) {
    await getPosition();
    if (!latitude.value || !longitude.value) return;
  }

  const success = await send({
    description: description.value,
    category: selectedCategory.value,
    latitude: latitude.value,
    longitude: longitude.value,
    image: photoFile.value ?? undefined,
  });

  if (success) {
    router.push("/success");
  }
}

function retryLocation() {
  getPosition();
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
    <!-- Indicador de pasos -->
    <div class="flex items-center justify-center gap-2 mb-6">
      <div
        class="h-2 rounded-full transition-all duration-300"
        :class="[
          step === 'category' ? 'w-8 bg-green-600' : 'w-4 bg-green-300',
        ]"
      />
      <div
        class="h-2 rounded-full transition-all duration-300"
        :class="[
          step === 'details' ? 'w-8 bg-green-600' : 'w-4 bg-green-300',
        ]"
      />
      <div
        class="h-2 rounded-full transition-all duration-300"
        :class="[
          step === 'review' ? 'w-8 bg-green-600' : 'w-4 bg-green-300',
        ]"
      />
    </div>

    <!-- Geolocalización -->
    <LocationDisplay
      :latitude="latitude"
      :longitude="longitude"
      :loading="geoLoading"
      :error="geoError"
      @retry="retryLocation"
    />

    <!-- Paso 1: Categoría -->
    <div v-if="step === 'category'">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        ¿Qué tipo de incidente quieres reportar?
      </h3>
      <CategorySelector
        :categories="CATEGORIES"
        :selected="selectedCategory"
        @select="selectCategory"
      />
    </div>

    <!-- Paso 2: Detalles -->
    <div v-if="step === 'details'">
      <button
        class="text-sm text-green-700 mb-4 flex items-center gap-1"
        @click="step = 'category'"
      >
        ← Volver
      </button>
      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        Describe el incidente
      </h3>

      <label class="block text-sm font-medium text-gray-600 mb-2">
        Descripción
      </label>
      <textarea
        v-model="description"
        rows="4"
        class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
        placeholder="Describe lo que observaste con el mayor detalle posible..."
        maxlength="2000"
      />
      <p class="text-xs text-gray-400 mt-1 text-right">
        {{ description.length }}/2000
      </p>

      <!-- Foto -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-600 mb-2">
          Evidencia fotográfica (opcional)
        </label>

        <div v-if="!showCamera && !photoFile">
          <button
            class="w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors flex flex-col items-center gap-2"
            @click="showCamera = true"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span class="text-sm">Tomar foto</span>
          </button>
        </div>

        <CameraCapture
          v-if="showCamera"
          @photo="handlePhoto"
          @cancel="showCamera = false"
        />

        <div v-if="photoFile" class="mt-2 relative">
          <img
            :src="createObjectURL(photoFile)"
            alt="Evidencia"
            class="w-full h-48 object-cover rounded-xl"
          />
          <button
            class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow"
            @click="photoFile = null"
          >
            ✕
          </button>
        </div>
      </div>

      <button
        class="mt-6 w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
        :disabled="!canProceed"
        @click="step = 'review'"
      >
        Continuar
      </button>
    </div>

    <!-- Paso 3: Revisión y envío -->
    <div v-if="step === 'review'">
      <button
        class="text-sm text-green-700 mb-4 flex items-center gap-1"
        @click="step = 'details'"
      >
        ← Volver
      </button>

      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        Confirma tu denuncia
      </h3>

      <div class="space-y-3 text-sm">
        <div class="bg-gray-50 rounded-xl p-3">
          <span class="text-gray-500">Categoría:</span>
          <span class="font-medium ml-2">{{ selectedCategory }}</span>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <span class="text-gray-500">Descripción:</span>
          <p class="font-medium mt-1">{{ description }}</p>
        </div>
        <div v-if="photoFile" class="bg-gray-50 rounded-xl p-3">
          <span class="text-gray-500">Foto:</span>
          <span class="font-medium ml-2">Incluida</span>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <span class="text-gray-500">Ubicación:</span>
          <span class="font-medium ml-2">
            {{ latitude?.toFixed(4) }}, {{ longitude?.toFixed(4) }}
          </span>
        </div>
      </div>

      <!-- Error de envío -->
      <div
        v-if="sendError"
        class="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3"
      >
        {{ sendError }}
      </div>

      <button
        class="mt-6 w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        :disabled="sending || !latitude"
        @click="handleSubmit"
      >
        <svg
          v-if="sending"
          class="animate-spin w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ sending ? "Enviando..." : "Enviar denuncia" }}
      </button>
    </div>
  </div>
</template>
