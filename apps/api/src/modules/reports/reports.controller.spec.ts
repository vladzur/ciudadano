import { Test, TestingModule } from "@nestjs/testing";
import { ReportStatus } from "@ciudadano/shared";
import { ReportsController } from "./reports.controller.js";
import { ReportsService } from "./reports.service.js";

describe("ReportsController", () => {
  let controller: ReportsController;
  let reportsService: ReportsService;

  const mockReport = {
    id: "uuid-1",
    description: "Bache profundo",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: null,
    category: "Baches",
    status: "pending",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            createNote: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
  });

  describe("create", () => {
    const mockReq = { user: { sub: "citizen-uuid-1" } };

    it("should create report and return wrapped response", async () => {
      const dto = {
        description: "Bache profundo en la calle",
        category: "Baches",
        latitude: -39.2785,
        longitude: -72.2284,
      };
      (reportsService.create as jest.Mock).mockResolvedValue(mockReport);

      const result = await controller.create(dto, undefined, mockReq);

      expect(reportsService.create).toHaveBeenCalledWith(dto, undefined, "citizen-uuid-1");
      expect(result).toEqual({ success: true, data: mockReport });
    });

    it("should pass image file and citizen user id to service", async () => {
      const dto = {
        description: "Bache profundo en la calle",
        category: "Baches",
        latitude: -39.2785,
        longitude: -72.2284,
      };
      const image = {} as Express.Multer.File;
      (reportsService.create as jest.Mock).mockResolvedValue(mockReport);

      await controller.create(dto, image, mockReq);

      expect(reportsService.create).toHaveBeenCalledWith(dto, image, "citizen-uuid-1");
    });
  });

  describe("findAll", () => {
    it("should return paginated results from service", async () => {
      const params = { page: 1, limit: 20 };
      const paginatedResult = {
        success: true,
        data: [mockReport],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      (reportsService.findAll as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await controller.findAll(params);

      expect(reportsService.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe("findById", () => {
    it("should return report detail with notes", async () => {
      const reportWithNotes = {
        ...mockReport,
        notes: [{ id: "note-1", report_id: "uuid-1", content: "Nota", created_by: "admin", created_at: "2025-01-15T00:00:00Z" }],
      };
      (reportsService.findById as jest.Mock).mockResolvedValue(reportWithNotes);

      const result = await controller.findById("uuid-1");

      expect(reportsService.findById).toHaveBeenCalledWith("uuid-1");
      expect(result).toEqual({ success: true, data: reportWithNotes });
    });
  });

  describe("updateStatus", () => {
    it("should update status and return wrapped response", async () => {
      const updated = { ...mockReport, status: ReportStatus.IN_PROGRESS };
      (reportsService.updateStatus as jest.Mock).mockResolvedValue(updated);

      const result = await controller.updateStatus("uuid-1", { status: ReportStatus.IN_PROGRESS });

      expect(reportsService.updateStatus).toHaveBeenCalledWith("uuid-1", { status: "in_progress" });
      expect(result).toEqual({ success: true, data: updated });
    });
  });

  describe("createNote", () => {
    it("should create note with user email from request", async () => {
      const note = { id: "note-1", report_id: "uuid-1", content: "Seguimiento", created_by: "admin@test.cl", created_at: "2025-01-15T00:00:00Z" };
      (reportsService.createNote as jest.Mock).mockResolvedValue(note);
      const req = { user: { email: "admin@test.cl" } };

      const result = await controller.createNote("uuid-1", { content: "Seguimiento" }, req);

      expect(reportsService.createNote).toHaveBeenCalledWith(
        "uuid-1",
        { content: "Seguimiento" },
        "admin@test.cl"
      );
      expect(result).toEqual({ success: true, data: note });
    });
  });
});
