import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

/** Hook que encapsula lógica de autenticación */
export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();
  const error = ref<string | null>(null);
  const loading = ref(false);

  async function login(email: string, password: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await store.login(email, password);
      router.push("/");
    } catch (err: unknown) {
      error.value =
        err instanceof Error ? err.message : "Error de autenticación.";
    } finally {
      loading.value = false;
    }
  }

  return { error, loading, login };
}
