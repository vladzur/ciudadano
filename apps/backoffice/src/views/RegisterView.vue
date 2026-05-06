<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref<string | null>(null);
const success = ref(false);
const loading = ref(false);
const router = useRouter();

async function handleRegister() {
  error.value = null;
  if (password.value !== confirmPassword.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }
  if (password.value.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }
  loading.value = true;
  try {
    await api.post("/auth/register", {
      name: name.value,
      email: email.value,
      password: password.value,
    });
    success.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Error al registrarse. Intenta de nuevo.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-700 to-green-900 px-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-green-800">Registro</h1>
        <p class="text-sm text-gray-500 mt-1">Backoffice Denuncia Ciudadana</p>
      </div>

      <!-- Mensaje de éxito -->
      <div
        v-if="success"
        class="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-center"
      >
        <p class="font-semibold text-lg mb-2">¡Registro exitoso!</p>
        <p class="text-sm">
          Tu cuenta está pendiente de aprobación por un administrador.
          Recibirás acceso una vez que sea aprobada.
        </p>
        <router-link
          to="/login"
          class="inline-block mt-4 text-sm text-green-700 hover:text-green-800 font-medium"
        >
          Volver al inicio de sesión
        </router-link>
      </div>

      <!-- Formulario de registro -->
      <form v-else @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo
          </label>
          <input
            v-model="name"
            type="text"
            required
            minlength="2"
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="correo@ejemplo.cl"
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
            minlength="6"
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Repite tu contraseña"
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
          {{ loading ? "Registrando..." : "Registrarse" }}
        </button>

        <div class="text-center">
          <router-link
            to="/login"
            class="text-sm text-gray-500 hover:text-green-700"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
