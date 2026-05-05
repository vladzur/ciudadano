<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "../composables/useAuth";

const email = ref("");
const password = ref("");
const { error, loading, login } = useAuth();

async function handleSubmit() {
  await login(email.value, password.value);
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-700 to-green-900 px-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-green-800">Backoffice</h1>
        <p class="text-sm text-gray-500 mt-1">Denuncia Ciudadana Villarrica</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="admin@villarrica.cl"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="••••••"
          />
        </div>

        <div
          v-if="error"
          class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          :disabled="loading"
        >
          <svg
            v-if="loading"
            class="animate-spin w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? "Ingresando..." : "Ingresar" }}
        </button>
      </form>
    </div>
  </div>
</template>
