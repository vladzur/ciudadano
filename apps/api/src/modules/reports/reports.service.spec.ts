import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ReportStatus } from "@ciudadano/shared";
import { ReportsService } from "./reports.service.js";
import { ReportsRepository } from "./reports.repository.js";
import { StorageService } from "../storage/storage.service.js";

describe("ReportsService", () => {
  let service: ReportsService;
  let repository: ReportsRepository;
  let storage: StorageService;

  const mockReport = {
    id: "uuid-1",
    description: "Bache profundo en la calle principal",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: null,
    category: "Baches",
    status: ReportStatus.PENDING,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findNotes: jest.fn(),
            updateStatus: jest.fn(),
            createNote: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: { uploadImage: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get<ReportsRepository>(ReportsRepository);
    storage = module.get<StorageService>(StorageService);
  });

  describe("create", () => {
    const dto = {
      description: "Bache profundo en la calle principal",
      category: "Baches",
      latitude: -39.2785,
      longitude: -72.2284,
    };

    it("should create a report without image", async () => {
      (repository.create as jest.Mock).mockResolvedValue(mockReport);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        imageUrl: undefined,
      });
      expect(result).toEqual(mockReport);
    });

    it("should upload image and create report when valid image is provided", async () => {
      const imageFile = {
        mimetype: "image/jpeg",
        size: 1024 * 1024,
        buffer: Buffer.from("test"),
      } as Express.Multer.File;
      (storage.uploadImage as jest.Mock).mockResolvedValue("reports/uuid.jpg");
      (repository.create as jest.Mock).mockResolvedValue({
        ...mockReport,
        image_url: "reports/uuid.jpg",
      });

      const result = await service.create(dto, imageFile);

      expect(storage.uploadImage).toHaveBeenCalledWith(imageFile);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        imageUrl: "reports/uuid.jpg",
      });
      expect(result.image_url).toBe("reports/uuid.jpg");
    });

    it("should reject invalid image format", async () => {
      const imageFile = {
        mimetype: "image/gif",
        size: 1024,
      } as Express.Multer.File;

      await expect(service.create(dto, imageFile)).rejects.toThrow(BadRequestException);
    });

    it("should reject image larger than 10MB", async () => {
      const imageFile = {
        mimetype: "image/jpeg",
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(service.create(dto, imageFile)).rejects.toThrow(BadRequestException);
    });

    it("should accept webp format", async () => {
      const imageFile = {
        mimetype: "image/webp",
        size: 1024,
      } as Express.Multer.File;
      (storage.uploadImage as jest.Mock).mockResolvedValue("reports/uuid.webp");
      (repository.create as jest.Mock).mockResolvedValue(mockReport);

      await service.create(dto, imageFile);

      expect(storage.uploadImage).toHaveBeenCalledWith(imageFile);
    });
  });

  describe("findAll", () => {
    it("should return paginated results with filters", async () => {
      const params = { status: ReportStatus.PENDING, page: 1, limit: 10 };
      const paginatedResult = { data: [mockReport], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      (repository.findAll as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await service.findAll(params);
      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe("findById", () => {
    it("should return report with notes when found", async () => {
      const notes = [{ id: "note-1", report_id: "uuid-1", content: "Nota", created_by: "admin", created_at: "2025-01-01T00:00:00Z" }];
      (repository.findById as jest.Mock).mockResolvedValue(mockReport);
      (repository.findNotes as jest.Mock).mockResolvedValue(notes);

      const result = await service.findById("uuid-1");

      expect(result).toEqual({ ...mockReport, notes });
    });

    it("should throw NotFoundException when report does not exist", async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatus", () => {
    it("should update status when report exists", async () => {
      const updated = { ...mockReport, status: ReportStatus.IN_PROGRESS };
      (repository.findById as jest.Mock).mockResolvedValue(mockReport);
      (repository.updateStatus as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateStatus("uuid-1", { status: ReportStatus.IN_PROGRESS });

      expect(repository.updateStatus).toHaveBeenCalledWith("uuid-1", "in_progress");
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when report does not exist", async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus("nonexistent", { status: ReportStatus.IN_PROGRESS })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createNote", () => {
    it("should create a note when report exists", async () => {
      const note = { id: "note-1", report_id: "uuid-1", content: "Seguimiento", created_by: "admin@test.cl", created_at: "2025-01-01T00:00:00Z" };
      (repository.findById as jest.Mock).mockResolvedValue(mockReport);
      (repository.createNote as jest.Mock).mockResolvedValue(note);

      const result = await service.createNote("uuid-1", { content: "Seguimiento" }, "admin@test.cl");

      expect(repository.createNote).toHaveBeenCalledWith({
        reportId: "uuid-1",
        content: "Seguimiento",
        createdBy: "admin@test.cl",
      });
      expect(result).toEqual(note);
    });

    it("should throw NotFoundException when report does not exist", async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createNote("nonexistent", { content: "Seguimiento" }, "admin@test.cl")
      ).rejects.toThrow(NotFoundException);
    });
  });
});
