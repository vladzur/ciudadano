<script setup lang="ts">
import { computed } from "vue";
import type { ReportStatus } from "@ciudadano/shared";

const props = defineProps<{
  status: ReportStatus;
}>();

const config = computed(() => {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
    in_progress: { label: "En Gestión", className: "bg-blue-100 text-blue-800" },
    resolved: { label: "Resuelto", className: "bg-green-100 text-green-800" },
  };
  return map[props.status] ?? { label: props.status, className: "bg-gray-100 text-gray-800" };
});
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="config.className"
  >
    {{ config.label }}
  </span>
</template>
