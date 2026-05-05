/** Estados posibles de una denuncia ciudadana */
export enum ReportStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
}

/** Categorías de denuncias disponibles */
export enum ReportCategory {
  LUMINARIAS = "Luminarias",
  BACHES = "Baches",
  ASEO = "Aseo",
  SEGURIDAD = "Seguridad",
  RUIDO = "Ruido",
  TRAFICO = "Tráfico",
  AREAS_VERDES = "Áreas Verdes",
  OTRO = "Otro",
}

/** Interfaz principal de una denuncia */
export interface IReport {
  id: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  image_url: string | null;
  category: ReportCategory;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

/** Nota interna de seguimiento */
export interface IInternalNote {
  id: string;
  report_id: string;
  content: string;
  created_by: string;
  created_at: string;
}
