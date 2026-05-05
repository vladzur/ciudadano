import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { Response } from "express";
import { ReportsAnalyticsService } from "./reports-analytics.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../../common/decorators/roles.decorator.js";

@Controller()
export class ReportsAnalyticsController {
  constructor(private readonly analyticsService: ReportsAnalyticsService) {}

  /** GET /api/v1/reports/analytics/heatmap - Datos para mapa de calor */
  @Get("reports/analytics/heatmap")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async getHeatmapData(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("category") category?: string
  ) {
    const data = await this.analyticsService.getHeatmapData({
      startDate,
      endDate,
      category,
    });
    return { success: true, data };
  }

  /** GET /api/v1/reports/analytics/stats - KPIs del dashboard */
  @Get("reports/analytics/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async getStats() {
    const data = await this.analyticsService.getStats();
    return { success: true, data };
  }

  /** GET /api/v1/reports/export/pdf - Generar PDF */
  @Get("reports/export/pdf")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async exportPdf(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    const buffer = await this.analyticsService.generatePdfReport({
      startDate,
      endDate,
    });
    res!.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="reporte-gestion.pdf"',
      "Content-Length": buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }

  /** GET /api/v1/reports/export/excel - Generar Excel */
  @Get("reports/export/excel")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async exportExcel(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    const buffer = await this.analyticsService.generateExcelReport({
      startDate,
      endDate,
    });
    res!.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reporte-gestion.xlsx"',
      "Content-Length": buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }

  /** GET /api/v1/storage/signed-url/:key - Obtener Signed URL */
  @Get("storage/signed-url/:key")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async getSignedUrl(@Param("key") key: string) {
    const data = await this.analyticsService.getSignedUrl(key);
    return { success: true, data: { url: data } };
  }
}
