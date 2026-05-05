<script setup lang="ts">
import type { IInternalNote } from "@ciudadano/shared";

defineProps<{
  notes: IInternalNote[];
}>();
</script>

<template>
  <div v-if="notes.length === 0" class="text-sm text-gray-400 text-center py-4">
    Sin notas de seguimiento aún.
  </div>

  <div v-else class="space-y-3">
    <div
      v-for="note in notes"
      :key="note.id"
      class="border-l-2 border-green-300 pl-4 py-1"
    >
      <p class="text-sm text-gray-700">{{ note.content }}</p>
      <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
        <span>{{ note.created_by }}</span>
        <span>·</span>
        <span>{{ new Date(note.created_at).toLocaleDateString("es-CL") }}</span>
      </div>
    </div>
  </div>
</template>
