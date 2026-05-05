import { Test, TestingModule } from "@nestjs/testing";
import { ReportsAnalyticsService } from "./reports-analytics.service.js";
import { ReportsRepository } from "../reports/reports.repository.js";
import { StorageService } from "../storage/storage.service.js";

describe("ReportsAnalyticsService", () => {
  let service: ReportsAnalyticsService;
  let repository: ReportsRepository;
  let storage: StorageService;

  const mockReport = {
    id: "uuid-1",
    description: "Bache en la calle",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: null,
    category: "Baches",
    status: "pending",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  };

  const mockStats = {
    total: 3,
    byStatus: { pending: 1, in_progress: 1, resolved: 1 },
    byCategory: { Baches: 2, Luminarias: 1 },
    pendingCount: 1,
    inProgressCount: 1,
    resolvedCount: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsAnalyticsService,
        {
          provide: ReportsRepository,
          useValue: {
            getHeatmapData: jest.fn(),
            getStats: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: { getSignedUrl: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsAnalyticsService>(ReportsAnalyticsService);
    repository = module.get<ReportsRepository>(ReportsRepository);
    storage = module.get<StorageService>(StorageService);
  });

  describe("getHeatmapData", () => {
    it("should return heatmap points from repository", async () => {
      const points = [{ lat: -39.2785, lng: -72.2284, intensity: 1.0 }];
      (repository.getHeatmapData as jest.Mock).mockResolvedValue(points);

      const result = await service.getHeatmapData();

      expect(repository.getHeatmapData).toHaveBeenCalled();
      expect(result).toEqual(points);
    });

    it("should pass filters to repository", async () => {
      const params = { startDate: "2025-01-01", endDate: "2025-01-31", category: "Baches" };
      (repository.getHeatmapData as jest.Mock).mockResolvedValue([]);

      await service.getHeatmapData(params);

      expect(repository.getHeatmapData).toHaveBeenCalledWith(params);
    });
  });

  describe("getStats", () => {
    it("should return stats from repository", async () => {
      (repository.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await service.getStats();

      expect(repository.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe("generatePdfReport", () => {
    it("should generate a PDF buffer", async () => {
      (repository.findAll as jest.Mock).mockResolvedValue({
        data: [mockReport],
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
      (repository.getStats as jest.Mock).mockResolvedValue(mockStats);

      const buffer = await service.generatePdfReport();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(repository.findAll).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        limit: 1000,
      });
      expect(repository.getStats).toHaveBeenCalled();
    });

    it("should pass date filters to findAll when generating PDF", async () => {
      (repository.findAll as jest.Mock).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 1000, totalPages: 1 },
      });
      (repository.getStats as jest.Mock).mockResolvedValue(mockStats);

      await service.generatePdfReport({ startDate: "2025-01-01", endDate: "2025-01-31" });

      expect(repository.findAll).toHaveBeenCalledWith({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        limit: 1000,
      });
    });
  });

  describe("generateExcelReport", () => {
    it("should generate an Excel buffer", async () => {
      (repository.findAll as jest.Mock).mockResolvedValue({
        data: [mockReport],
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });

      const buffer = await service.generateExcelReport();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("getSignedUrl", () => {
    it("should delegate to StorageService", async () => {
      (storage.getSignedUrl as jest.Mock).mockResolvedValue("https://signed.url/img.jpg");

      const url = await service.getSignedUrl("reports/uuid.jpg");

      expect(storage.getSignedUrl).toHaveBeenCalledWith("reports/uuid.jpg");
      expect(url).toBe("https://signed.url/img.jpg");
    });
  });
});
