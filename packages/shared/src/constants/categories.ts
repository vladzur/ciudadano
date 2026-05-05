import { ReportCategory } from "../types/report.js";

/** Lista de categorías disponibles con etiquetas legibles */
export const CATEGORIES: { value: ReportCategory; label: string; icon: string }[] = [
  { value: ReportCategory.LUMINARIAS, label: "Luminarias", icon: "lightbulb" },
  { value: ReportCategory.BACHES, label: "Baches", icon: "road" },
  { value: ReportCategory.ASEO, label: "Aseo", icon: "trash" },
  { value: ReportCategory.SEGURIDAD, label: "Seguridad", icon: "shield" },
  { value: ReportCategory.RUIDO, label: "Ruido", icon: "volume" },
  { value: ReportCategory.TRAFICO, label: "Tráfico", icon: "car" },
  { value: ReportCategory.AREAS_VERDES, label: "Áreas Verdes", icon: "tree" },
  { value: ReportCategory.OTRO, label: "Otro", icon: "ellipsis" },
];
