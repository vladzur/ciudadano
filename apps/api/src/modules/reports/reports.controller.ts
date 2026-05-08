import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ReportsService } from "./reports.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import type { CreateReportDto, ReportQueryParams, UpdateReportStatusDto, CreateNoteDto } from "@ciudadano/shared";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** POST /api/v1/reports - Ciudadano autenticado crea denuncia */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("image"))
  async create(
    @Body() dto: CreateReportDto,
    @UploadedFile() image?: Express.Multer.File,
    @Request() req?: any
  ) {
    const citizenUserId = req.user?.sub;
    return { success: true, data: await this.reportsService.create(dto, image, citizenUserId) };
  }

  /** GET /api/v1/reports - Listar denuncias (admin autenticado) */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async findAll(@Query() params: ReportQueryParams) {
    return this.reportsService.findAll(params);
  }

  /** GET /api/v1/reports/:id - Detalle de denuncia (admin autenticado) */
  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    const data = await this.reportsService.findById(id);
    return { success: true, data };
  }

  /** PATCH /api/v1/reports/:id/status - Cambiar estado (admin autenticado) */
  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportStatusDto
  ) {
    const data = await this.reportsService.updateStatus(id, dto);
    return { success: true, data };
  }

  /** POST /api/v1/reports/:id/notes - Añadir nota (admin autenticado) */
  @Post(":id/notes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "staff")
  async createNote(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateNoteDto,
    @Request() req: any
  ) {
    const data = await this.reportsService.createNote(id, dto, req.user.email);
    return { success: true, data };
  }
}
