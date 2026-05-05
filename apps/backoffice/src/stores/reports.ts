import { defineStore } from "pinia";
import { ref } from "vue";
import {
  fetchReports,
  fetchReportById,
  updateReportStatus,
  createNote,
  fetchStats,
} from "../services/api";
import type {
  IReport,
  IInternalNote,
  ReportQueryParams,
  ReportStats,
} from "@ciudadano/shared";

/** Store de gestión de denuncias */
export const useReportsStore = defineStore("reports", () => {
  const reports = ref<IReport[]>([]);
  const selectedReport = ref<(IReport & { notes: IInternalNote[] }) | null>(null);
  const stats = ref<ReportStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);
  const page = ref(1);
  const totalPages = ref(1);

  /** Carga lista paginada con filtros */
  async function loadReports(params?: ReportQueryParams): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const result = await fetchReports(params);
      reports.value = result.data;
      total.value = result.meta.total;
      page.value = result.meta.page;
      totalPages.value = result.meta.totalPages;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Error al cargar denuncias.";
    } finally {
      loading.value = false;
    }
  }

  /** Carga detalle de una denuncia con notas */
  async function loadReportDetail(id: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      selectedReport.value = await fetchReportById(id);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Error al cargar detalle.";
    } finally {
      loading.value = false;
    }
  }

  /** Cambia el estado de una denuncia */
  async function changeStatus(id: string, status: string): Promise<void> {
    error.value = null;
    try {
      const result = await updateReportStatus(id, status);
      if (selectedReport.value && selectedReport.value.id === id) {
        selectedReport.value = { ...selectedReport.value, ...result.data };
      }
      // Actualizar en la lista
      const idx = reports.value.findIndex((r) => r.id === id);
      if (idx !== -1) {
        reports.value[idx] = { ...reports.value[idx], ...result.data };
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Error al cambiar estado.";
    }
  }

  /** Añade nota de seguimiento */
  async function addNote(reportId: string, content: string): Promise<void> {
    error.value = null;
    try {
      const result = await createNote(reportId, content);
      if (selectedReport.value) {
        selectedReport.value.notes.unshift(result.data);
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Error al añadir nota.";
    }
  }

  /** Carga estadísticas del dashboard */
  async function loadStats(): Promise<void> {
    error.value = null;
    try {
      stats.value = await fetchStats();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Error al cargar estadísticas.";
    }
  }

  return {
    reports,
    selectedReport,
    stats,
    loading,
    error,
    total,
    page,
    totalPages,
    loadReports,
    loadReportDetail,
    changeStatus,
    addNote,
    loadStats,
  };
});
