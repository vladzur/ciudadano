import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { login as apiLogin } from "../services/api";
import type { IAdminUser } from "@ciudadano/shared";

/** Store de autenticación del backoffice */
export const useAuthStore = defineStore("auth", () => {
  const user = ref<IAdminUser | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem("accessToken"));
  const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));

  const isAuthenticated = computed(() => !!accessToken.value);

  /** Inicia sesión con email y contraseña */
  async function login(email: string, password: string): Promise<void> {
    const response = await apiLogin(email, password);
    accessToken.value = response.accessToken;
    refreshToken.value = response.refreshToken;
    user.value = response.user;

    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
  }

  /** Cierra sesión y limpia el estado */
  function logout(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  return { user, accessToken, refreshToken, isAuthenticated, login, logout };
});
