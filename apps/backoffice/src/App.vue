<script setup lang="ts">
import { useAuthStore } from "./stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar (solo si está autenticado) -->
    <nav
      v-if="auth.isAuthenticated"
      class="bg-white border-b border-gray-200 shadow-sm"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-green-800">VRR</span>
            <span class="text-sm text-gray-500 hidden sm:inline">
              Panel de Gestión
            </span>
          </div>
          <div class="flex items-center gap-4">
            <router-link
              to="/"
              class="text-sm text-gray-600 hover:text-green-700 transition-colors"
            >
              Dashboard
            </router-link>
            <router-link
              to="/reports"
              class="text-sm text-gray-600 hover:text-green-700 transition-colors"
            >
              Denuncias
            </router-link>
            <router-link
              to="/export"
              class="text-sm text-gray-600 hover:text-green-700 transition-colors"
            >
              Reportes
            </router-link>
            <button
              class="text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
              @click="logout"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Contenido -->
    <router-view />
  </div>
</template>
