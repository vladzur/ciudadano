import { ReportStatus } from "@ciudadano/shared";
import { ReportsRepository } from "./reports.repository.js";
import { pool } from "@ciudadano/database";

jest.mock("@ciudadano/database", () => ({
  pool: { query: jest.fn() },
}));

describe("ReportsRepository", () => {
  let repository: ReportsRepository;

  const mockRow = {
    id: "uuid-1",
    description: "Bache profundo",
    lat: -39.2785,
    lng: -72.2284,
    image_url: null,
    category: "Baches",
    status: ReportStatus.PENDING,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  };

  const mockReport = {
    id: "uuid-1",
    description: "Bache profundo",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: null,
    category: "Baches",
    status: ReportStatus.PENDING,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ReportsRepository();
  });

  describe("create", () => {
    it("should insert report and return mapped result", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const result = await repository.create({
        description: "Bache profundo",
        category: "Baches",
        latitude: -39.2785,
        longitude: -72.2284,
      });

      expect(result).toEqual(mockReport);
    });

    it("should include imageUrl when provided", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ ...mockRow, image_url: "reports/uuid.jpg" }],
      });

      const result = await repository.create({
        description: "Bache profundo",
        category: "Baches",
        latitude: -39.2785,
        longitude: -72.2284,
        imageUrl: "reports/uuid.jpg",
      });

      expect(result.image_url).toBe("reports/uuid.jpg");
    });
  });

  describe("findAll", () => {
    it("should return paginated results", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: "10" }] })
        .mockResolvedValueOnce({ rows: [mockRow] });

      const result = await repository.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(10);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });

    it("should apply status filter", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: "5" }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.findAll({ status: ReportStatus.PENDING });

      // Verifica que la primera query incluya el filtro de status
      const [[firstQuery]] = (pool.query as jest.Mock).mock.calls;
      expect(firstQuery).toContain("AND status");
    });

    it("should apply category filter", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: "2" }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.findAll({ category: "Baches" });

      const [[firstQuery]] = (pool.query as jest.Mock).mock.calls;
      expect(firstQuery).toContain("AND category");
    });

    it("should apply date filters", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: "3" }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.findAll({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      const [[firstQuery]] = (pool.query as jest.Mock).mock.calls;
      expect(firstQuery).toContain("AND created_at >=");
      expect(firstQuery).toContain("AND created_at <=");
    });
  });

  describe("findById", () => {
    it("should return report when found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const result = await repository.findById("uuid-1");

      expect(result).toEqual(mockReport);
    });

    it("should return null when not found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("should update and return report", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ ...mockRow, status: ReportStatus.IN_PROGRESS }],
      });

      const result = await repository.updateStatus("uuid-1", ReportStatus.IN_PROGRESS);

      expect(result.status).toBe(ReportStatus.IN_PROGRESS);
    });
  });

  describe("createNote", () => {
    it("should create note and return it", async () => {
      const noteRow = {
        id: "note-1",
        report_id: "uuid-1",
        content: "Nota de seguimiento",
        created_by: "admin@test.cl",
        created_at: "2025-01-15T00:00:00Z",
      };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [noteRow] });

      const result = await repository.createNote({
        reportId: "uuid-1",
        content: "Nota de seguimiento",
        createdBy: "admin@test.cl",
      });

      expect(result).toEqual(noteRow);
    });
  });

  describe("findNotes", () => {
    it("should return notes ordered by created_at DESC", async () => {
      const notes = [
        { id: "note-2", report_id: "uuid-1", content: "Segunda", created_by: "admin", created_at: "2025-01-16T00:00:00Z" },
        { id: "note-1", report_id: "uuid-1", content: "Primera", created_by: "admin", created_at: "2025-01-15T00:00:00Z" },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: notes });

      const result = await repository.findNotes("uuid-1");

      expect(result).toEqual(notes);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC"),
        ["uuid-1"]
      );
    });
  });

  describe("getHeatmapData", () => {
    it("should return aggregated points with intensity based on status", async () => {
      const points = [
        { lat: -39.2785, lng: -72.2284, intensity: 1.0 },
        { lat: -39.2790, lng: -72.2290, intensity: 0.5 },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: points });

      const result = await repository.getHeatmapData();

      expect(result).toEqual(points);
    });

    it("should pass filters to query", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await repository.getHeatmapData({
        startDate: "2025-01-01",
        category: "Baches",
      });

      const [[query]] = (pool.query as jest.Mock).mock.calls;
      expect(query).toContain("AND created_at >=");
      expect(query).toContain("AND category");
    });
  });

  describe("getStats", () => {
    it("should aggregate reports by status and category", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { status: "pending", count: 5 },
            { status: "resolved", count: 3 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { category: "Baches", count: 4 },
            { category: "Luminarias", count: 4 },
          ],
        });

      const result = await repository.getStats();

      expect(result.total).toBe(8);
      expect(result.pendingCount).toBe(5);
      expect(result.resolvedCount).toBe(3);
      expect(result.inProgressCount).toBe(0);
      expect(result.byStatus).toEqual({ pending: 5, resolved: 3 });
      expect(result.byCategory).toEqual({ Baches: 4, Luminarias: 4 });
    });
  });
});
