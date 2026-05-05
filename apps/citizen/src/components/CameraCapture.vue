<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const emit = defineEmits<{
  photo: [file: File];
  cancel: [];
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const error = ref<string | null>(null);
const streaming = ref(false);

let stream: MediaStream | null = null;

onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
      streaming.value = true;
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "No se pudo acceder a la cámara.";
  }
});

onUnmounted(() => {
  stopStream();
});

function stopStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  streaming.value = false;
}

function capture() {
  if (!videoRef.value) return;

  const canvas = document.createElement("canvas");
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(videoRef.value, 0, 0);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `report-${Date.now()}.jpg`, { type: "image/jpeg" });
    stopStream();
    emit("photo", file);
  }, "image/jpeg", 0.85);
}

function cancelCapture() {
  stopStream();
  emit("cancel");
}
</script>

<template>
  <div class="relative bg-black rounded-xl overflow-hidden">
    <!-- Mensaje de error -->
    <div
      v-if="error"
      class="p-4 bg-red-50 text-red-700 text-sm rounded-xl text-center"
    >
      <p>{{ error }}</p>
      <button
        class="mt-2 text-green-700 font-medium hover:underline"
        @click="cancelCapture"
      >
        Usar formulario sin foto
      </button>
    </div>

    <template v-else>
      <!-- Video stream -->
      <video
        ref="videoRef"
        class="w-full aspect-[3/4] object-cover"
        autoplay
        playsinline
        muted
      />

      <!-- Botones de control -->
      <div class="absolute bottom-0 inset-x-0 p-4 flex justify-center gap-4">
        <button
          class="bg-white/80 backdrop-blur-sm text-gray-800 font-medium px-4 py-2 rounded-full hover:bg-white transition-colors"
          @click="cancelCapture"
        >
          Cancelar
        </button>
        <button
          class="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors border-4 border-green-600"
          :disabled="!streaming"
          @click="capture"
        >
          <div class="w-12 h-12 rounded-full bg-white" />
        </button>
      </div>
    </template>
  </div>
</template>
