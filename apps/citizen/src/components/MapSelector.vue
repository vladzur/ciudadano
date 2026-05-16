<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import L from "leaflet";

const props = defineProps<{
  initialLat: number;
  initialLng: number;
}>();

const emit = defineEmits<{
  confirm: [lat: number, lng: number];
  cancel: [];
}>();

let map: L.Map | null = null;
let marker: L.Marker | null = null;
const mapContainer = ref<HTMLDivElement | null>(null);
const currentLat = ref(props.initialLat);
const currentLng = ref(props.initialLng);

onMounted(() => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    center: [props.initialLat, props.initialLng],
    zoom: 17,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  marker = L.marker([props.initialLat, props.initialLng], {
    draggable: true,
  }).addTo(map);

  marker.on("dragend", () => {
    const pos = marker!.getLatLng();
    currentLat.value = pos.lat;
    currentLng.value = pos.lng;
  });

  // Invalidar tamaño del mapa tras montaje (soluciona renderizado parcial en overlays)
  setTimeout(() => map?.invalidateSize(), 100);
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

function handleConfirm() {
  emit("confirm", currentLat.value, currentLng.value);
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-black">
    <!-- Header -->
    <div class="absolute top-0 left-0 right-0 z-[1000] bg-black/70 text-white px-4 py-3 flex items-center gap-3">
      <p class="flex-1 text-sm font-medium">
        Mover el pin a la ubicación del incidente
      </p>
      <button
        class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg"
        @click="emit('cancel')"
      >
        &times;
      </button>
    </div>

    <!-- Mapa -->
    <div ref="mapContainer" class="flex-1 w-full" />

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 z-[1000] bg-black/70 text-white px-4 py-4">
      <p class="text-xs text-center text-white/60 mb-3">
        {{ currentLat.toFixed(5) }}, {{ currentLng.toFixed(5) }}
      </p>
      <button
        class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        @click="handleConfirm"
      >
        Confirmar ubicación
      </button>
    </div>
  </div>
</template>
