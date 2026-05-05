<script setup lang="ts">
/** Componente wrapper para mapa Leaflet */
</script>

<template>
  <div class="w-full h-[500px] rounded-xl bg-gray-100 relative">
    <slot />
    <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg text-xs text-gray-500 px-2 py-1 shadow-sm z-[1000]">
      OpenStreetMap
    </div>
  </div>
</template>
