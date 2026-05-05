import { ref } from "vue";
import { submitReport } from "../services/api";
import type { IReport } from "@ciudadano/shared";

/** Hook para gestionar el envío de denuncias */
export function useReport() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const report = ref<IReport | null>(null);

  async function send(data: {
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    image?: File;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      report.value = await submitReport(data);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "Error al enviar la denuncia. Intente nuevamente.";
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, report, send };
}
