import { Injectable } from "@nestjs/common";
import { ReportsRepository } from "../reports/reports.repository.js";
import { StorageService } from "../storage/storage.service.js";
import PDFDocument from "pdfkit";
import type { HeatmapPoint, ReportStats } from "@ciudadano/shared";

@Injectable()
export class ReportsAnalyticsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly storage: StorageService
  ) {}

  /** Obtiene datos agregados para mapa de calor */
  async getHeatmapData(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<HeatmapPoint[]> {
    return this.repository.getHeatmapData(params);
  }

  /** Obtiene estadísticas del dashboard */
  async getStats(): Promise<ReportStats> {
    return this.repository.getStats();
  }

  /** Genera PDF de reporte mensual */
  async generatePdfReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const [reports, stats] = await Promise.all([
      this.repository.findAll({
        startDate: params?.startDate,
        endDate: params?.endDate,
        limit: 1000,
      }),
      this.repository.getStats(),
    ]);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Título
      doc.fontSize(18).text("Reporte de Gestión Municipal", { align: "center" });
      doc.fontSize(12).text("Municipalidad de Villarrica", { align: "center" });
      doc.moveDown();

      // Período
      doc.fontSize(10).text(
        `Período: ${params?.startDate ?? "Inicio"} - ${params?.endDate ?? "Actual"}`
      );
      doc.moveDown();

      // Resumen
      doc.fontSize(14).text("Resumen");
      doc.fontSize(11)
        .text(`Total de denuncias: ${stats.total}`)
        .text(`Pendientes: ${stats.pendingCount}`)
        .text(`En gestión: ${stats.inProgressCount}`)
        .text(`Resueltas: ${stats.resolvedCount}`);
      doc.moveDown();

      // Tabla de denuncias
      doc.fontSize(14).text("Detalle de Denuncias");
      doc.moveDown(0.5);

      reports.data.forEach((report, index) => {
        if (index > 0) doc.moveDown(0.5);
        doc.fontSize(10)
          .text(`#${index + 1} [${report.status}] ${report.category}`)
          .fontSize(9)
          .text(`${report.description.substring(0, 150)}...`)
          .text(`Ubicación: ${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`)
          .text(`Fecha: ${new Date(report.created_at).toLocaleDateString("es-CL")}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  /** Genera Excel de reporte mensual */
  async generateExcelReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Denuncias");

    sheet.columns = [
      { header: "ID", key: "id", width: 36 },
      { header: "Descripción", key: "description", width: 50 },
      { header: "Categoría", key: "category", width: 15 },
      { header: "Estado", key: "status", width: 15 },
      { header: "Latitud", key: "lat", width: 12 },
      { header: "Longitud", key: "lng", width: 12 },
      { header: "Fecha", key: "created_at", width: 20 },
    ];

    const reports = await this.repository.findAll({
      startDate: params?.startDate,
      endDate: params?.endDate,
      limit: 1000,
    });

    reports.data.forEach((r) => {
      sheet.addRow({
        id: r.id,
        description: r.description,
        category: r.category,
        status: r.status,
        lat: r.location.lat,
        lng: r.location.lng,
        created_at: new Date(r.created_at).toLocaleDateString("es-CL"),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /** Genera signed URL para una imagen */
  async getSignedUrl(objectKey: string): Promise<string> {
    return this.storage.getSignedUrl(objectKey);
  }
}
