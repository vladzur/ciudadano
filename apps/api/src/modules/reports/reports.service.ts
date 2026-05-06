import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ReportsRepository } from "./reports.repository.js";
import { StorageService } from "../storage/storage.service.js";
import type {
  IReport,
  CreateReportDto,
  ReportQueryParams,
  UpdateReportStatusDto,
  CreateNoteDto,
} from "@ciudadano/shared";

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly storage: StorageService
  ) {}

  /** Crea una denuncia con imagen opcional */
  async create(
    dto: CreateReportDto,
    imageFile?: Express.Multer.File,
    citizenUserId?: string
  ): Promise<IReport> {
    let imageUrl: string | undefined;

    if (imageFile) {
      // Validar tipo de imagen
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(imageFile.mimetype)) {
        throw new BadRequestException(
          "Formato de imagen no permitido. Use JPEG, PNG o WebP."
        );
      }
      // Validar tamaño máximo (10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new BadRequestException("La imagen no debe superar los 10MB.");
      }

      imageUrl = await this.storage.uploadImage(imageFile);
    }

    return this.repository.create({
      description: dto.description,
      category: dto.category,
      latitude: dto.latitude,
      longitude: dto.longitude,
      imageUrl,
      citizenUserId,
    });
  }

  /** Lista denuncias con filtros */
  async findAll(params: ReportQueryParams) {
    return this.repository.findAll(params);
  }

  /** Obtiene detalle de denuncia con notas */
  async findById(id: string) {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new NotFoundException("Denuncia no encontrada.");
    }
    const notes = await this.repository.findNotes(id);
    return { ...report, notes };
  }

  /** Actualiza estado de denuncia */
  async updateStatus(id: string, dto: UpdateReportStatusDto): Promise<IReport> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new NotFoundException("Denuncia no encontrada.");
    }
    return this.repository.updateStatus(id, dto.status);
  }

  /** Añade nota de seguimiento */
  async createNote(id: string, dto: CreateNoteDto, userEmail: string) {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new NotFoundException("Denuncia no encontrada.");
    }
    return this.repository.createNote({
      reportId: id,
      content: dto.content,
      createdBy: userEmail,
    });
  }
}
