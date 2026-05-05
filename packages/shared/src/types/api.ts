import type { IReport, IInternalNote, ReportStatus } from "./report.js";

/** Respuesta estándar de la API */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Respuesta paginada */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** DTO para crear una denuncia */
export interface CreateReportDto {
  description: string;
  category: string;
  latitude: number;
  longitude: number;
}

/** DTO para actualizar estado de denuncia */
export interface UpdateReportStatusDto {
  status: ReportStatus;
}

/** DTO para crear nota interna */
export interface CreateNoteDto {
  content: string;
}

/** Parámetros de filtro para listar denuncias */
export interface ReportQueryParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  category?: string;
  startDate?: string;
  endDate?: string;
}

/** Datos para el mapa de calor */
export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

/** Estadísticas del dashboard */
export interface ReportStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
}
