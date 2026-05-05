<script setup lang="ts">
import type { ReportCategory } from "@ciudadano/shared";

defineProps<{
  categories: { value: ReportCategory; label: string; icon: string }[];
  selected: string;
}>();

const emit = defineEmits<{
  select: [value: string];
}>();

const iconMap: Record<string, string> = {
  lightbulb: "💡",
  road: "🛣️",
  trash: "🗑️",
  shield: "🛡️",
  volume: "🔊",
  car: "🚗",
  tree: "🌳",
  ellipsis: "⋯",
};
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      v-for="cat in categories"
      :key="cat.value"
      class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200"
      :class="[
        selected === cat.value
          ? 'border-green-600 bg-green-50 shadow-md'
          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50',
      ]"
      @click="emit('select', cat.value)"
    >
      <span class="text-2xl">{{ iconMap[cat.icon] ?? "📋" }}</span>
      <span
        class="text-sm font-medium"
        :class="selected === cat.value ? 'text-green-800' : 'text-gray-700'"
      >
        {{ cat.label }}
      </span>
    </button>
  </div>
</template>
