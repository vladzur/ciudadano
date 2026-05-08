<script setup lang="ts">
import { ref, onMounted } from "vue";
import { fetchUsers, updateUserStatus, updateUserRole, deleteUser } from "../services/api";
import type { IAdminUser } from "@ciudadano/shared";

const users = ref<IAdminUser[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function loadUsers() {
  loading.value = true;
  error.value = null;
  try {
    users.value = await fetchUsers();
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Error al cargar usuarios.";
  } finally {
    loading.value = false;
  }
}

async function approveUser(id: string) {
  try {
    await updateUserStatus(id, "active");
    await loadUsers();
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Error al aprobar usuario.";
  }
}

async function rejectUser(id: string) {
  try {
    await updateUserStatus(id, "rejected");
    await loadUsers();
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Error al rechazar usuario.";
  }
}

async function changeRole(id: string, role: string) {
  try {
    await updateUserRole(id, role);
    await loadUsers();
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Error al cambiar rol.";
  }
}

async function removeUser(id: string, name: string) {
  if (!confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteUser(id);
    await loadUsers();
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Error al eliminar usuario.";
  }
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; class: string }> = {
    active: { label: "Activo", class: "bg-green-100 text-green-800" },
    pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
    rejected: { label: "Rechazado", class: "bg-red-100 text-red-800" },
  };
  return map[status] ?? { label: status, class: "bg-gray-100 text-gray-800" };
}

onMounted(loadUsers);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
      <button
        @click="loadUsers"
        class="text-sm text-green-700 hover:text-green-800 font-medium"
      >
        Refrescar
      </button>
    </div>

    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      Cargando usuarios...
    </div>

    <!-- Tabla -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Creado</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ user.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
            <td class="px-4 py-3">
              <select
                :value="user.role"
                @change="changeRole(user.id, ($event.target as HTMLSelectElement).value)"
                class="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                :class="statusBadge(user.status).class"
              >
                {{ statusBadge(user.status).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">
              {{ new Date(user.created_at).toLocaleDateString("es-CL") }}
            </td>
            <td class="px-4 py-3 text-right space-x-1">
              <button
                v-if="user.status === 'pending'"
                @click="approveUser(user.id)"
                class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors"
              >
                Aprobar
              </button>
              <button
                v-if="user.status === 'pending'"
                @click="rejectUser(user.id)"
                class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
              >
                Rechazar
              </button>
              <button
                @click="removeUser(user.id, user.name)"
                class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="6" class="text-center py-8 text-gray-500">
              No hay usuarios registrados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
