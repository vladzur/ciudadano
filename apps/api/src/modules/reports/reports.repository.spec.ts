import { ReportStatus } from "@ciudadano/shared";
import type { Firestore } from "firebase-admin/firestore";
import { ReportsRepository } from "./reports.repository.js";
import {
  createMockFirestore,
  mockTimestamp,
  type MockFirestore,
} from "../../testing/firestore.mock.js";

describe("ReportsRepository", () => {
  let db: MockFirestore;
  let repository: ReportsRepository;

  const reportData = {
    description: "Bache profundo",
    category: "Baches",
    status: ReportStatus.PENDING,
    location: { lat: -39.2785, lng: -72.2284 },
    imageUrl: null,
    citizenUserId: null,
    createdAt: mockTimestamp("2025-01-15T00:00:00Z"),
    updatedAt: mockTimestamp("2025-01-15T00:00:00Z"),
  };

  const mockReport = {
    id: "uuid-1",
    description: "Bache profundo",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: null,
    category: "Baches",
    status: ReportStatus.PENDING,
    created_at: "2025-01-15T00:00:00.000Z",
    updated_at: "2025-01-15T00:00:00.000Z",
  };

  beforeEach(() => {
    db = createMockFirestore();
    repository = new ReportsRepository(db as unknown as Firestore);
  });

  /** Siembra un documento de denuncia en el mock */
  async function seedReport(
    id: string,
    overrides: Record<string, unknown> = {}
  ): Promise<void> {
    await db
      .collection("reports")
      .doc(id)
      .set({ ...reportData, ...overrides });
  }

  describe("create", () => {
    it("should insert report with pending status and return mapped result", async () => {
      const result = await repository.create({
        description: "Bache profundo",
        category: "Baches",
        latitude: -39.2785,
        longitude: -72.2284,
      });

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(result).toEqual({
        ...mockReport,
        id: result.id,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
      });

      // Verifica que el documento quedó guardado con la estructura esperada
      const stored = db.__store.get("reports")!.get(result.id)!;
      expect(stored.status).toBe(ReportStatus.PENDING);
      expect(stored.location).toEqual({ lat: -39.2785, lng: -72.2284 });
    });

    it("should include imageUrl when provided", async () => {
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
    it("should return paginated results with meta", async () => {
      await seedReport("uuid-1");
      await seedReport("uuid-2");
      await seedReport("uuid-3");

      const result = await repository.findAll({ page: 1, limit: 2 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.totalPages).toBe(2);
    });

    it("should return remaining documents on page 2 via cursor walk", async () => {
      await seedReport("uuid-1");
      await seedReport("uuid-2");
      await seedReport("uuid-3");

      const result = await repository.findAll({ page: 2, limit: 2 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("uuid-3");
      expect(result.meta.total).toBe(3);
    });

    it("should return empty data when page exceeds available pages", async () => {
      await seedReport("uuid-1");
      await seedReport("uuid-2");

      const result = await repository.findAll({ page: 5, limit: 2 });

      expect(result.data).toEqual([]);
      expect(result.meta.totalPages).toBe(1);
    });

    it("should apply status filter", async () => {
      await repository.findAll({ status: ReportStatus.PENDING });

      const collection = (db.collection as jest.Mock).mock.results.at(-1)!
        .value as { where: jest.Mock };
      expect(collection.where).toHaveBeenCalledWith(
        "status",
        "==",
        ReportStatus.PENDING
      );
    });

    it("should apply category filter", async () => {
      await repository.findAll({ category: "Baches" });

      const collection = (db.collection as jest.Mock).mock.results.at(-1)!
        .value as { where: jest.Mock };
      expect(collection.where).toHaveBeenCalledWith("category", "==", "Baches");
    });

    it("should apply date filters", async () => {
      await repository.findAll({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      const collection = (db.collection as jest.Mock).mock.results.at(-1)!
        .value as { where: jest.Mock };
      expect(collection.where).toHaveBeenCalledWith(
        "createdAt",
        ">=",
        new Date("2025-01-01")
      );
      expect(collection.where).toHaveBeenCalledWith(
        "createdAt",
        "<=",
        new Date("2025-01-31")
      );
    });

    it("should order by createdAt desc with document id tie-break", async () => {
      await repository.findAll({});

      const collection = (db.collection as jest.Mock).mock.results.at(-1)!
        .value as { orderBy: jest.Mock };
      expect(collection.orderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(collection.orderBy).toHaveBeenCalledWith("__name__", "desc");
    });
  });

  describe("findById", () => {
    it("should return report when found", async () => {
      await seedReport("uuid-1");

      const result = await repository.findById("uuid-1");

      expect(result).toEqual(mockReport);
    });

    it("should return null when not found", async () => {
      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("should update and return report", async () => {
      await seedReport("uuid-1");

      const result = await repository.updateStatus(
        "uuid-1",
        ReportStatus.IN_PROGRESS
      );

      expect(result.status).toBe(ReportStatus.IN_PROGRESS);
      expect(db.__store.get("reports")!.get("uuid-1")!.status).toBe(
        ReportStatus.IN_PROGRESS
      );
    });
  });

  describe("createNote", () => {
    it("should create note in the report subcollection", async () => {
      const result = await repository.createNote({
        reportId: "uuid-1",
        content: "Nota de seguimiento",
        createdBy: "admin@test.cl",
      });

      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result).toEqual({
        id: result.id,
        report_id: "uuid-1",
        content: "Nota de seguimiento",
        created_by: "admin@test.cl",
        created_at: "2025-01-01T00:00:00.000Z",
      });
      expect(db.__store.get("reports/uuid-1/notes")?.size).toBe(1);
    });
  });

  describe("findNotes", () => {
    it("should return mapped notes from the subcollection", async () => {
      const notes = db.collection("reports").doc("uuid-1").collection("notes");
      await notes.doc("note-1").set({
        reportId: "uuid-1",
        content: "Primera",
        createdBy: "admin@test.cl",
        createdAt: mockTimestamp("2025-01-15T00:00:00Z"),
      });
      await notes.doc("note-2").set({
        reportId: "uuid-1",
        content: "Segunda",
        createdBy: "admin@test.cl",
        createdAt: mockTimestamp("2025-01-16T00:00:00Z"),
      });

      const result = await repository.findNotes("uuid-1");

      expect(result).toEqual([
        {
          id: "note-1",
          report_id: "uuid-1",
          content: "Primera",
          created_by: "admin@test.cl",
          created_at: "2025-01-15T00:00:00.000Z",
        },
        {
          id: "note-2",
          report_id: "uuid-1",
          content: "Segunda",
          created_by: "admin@test.cl",
          created_at: "2025-01-16T00:00:00.000Z",
        },
      ]);
    });
  });

  describe("getHeatmapData", () => {
    it("should return points with intensity based on status", async () => {
      await seedReport("uuid-1", { status: ReportStatus.PENDING });
      await seedReport("uuid-2", { status: ReportStatus.IN_PROGRESS });
      await seedReport("uuid-3", { status: ReportStatus.RESOLVED });

      const result = await repository.getHeatmapData();

      expect(result).toEqual([
        { id: "uuid-1", lat: -39.2785, lng: -72.2284, intensity: 1.0 },
        { id: "uuid-2", lat: -39.2785, lng: -72.2284, intensity: 0.5 },
        { id: "uuid-3", lat: -39.2785, lng: -72.2284, intensity: 0.1 },
      ]);
    });

    it("should apply filters", async () => {
      await repository.getHeatmapData({
        startDate: "2025-01-01",
        category: "Baches",
      });

      const collection = (db.collection as jest.Mock).mock.results.at(-1)!
        .value as { where: jest.Mock };
      expect(collection.where).toHaveBeenCalledWith(
        "createdAt",
        ">=",
        new Date("2025-01-01")
      );
      expect(collection.where).toHaveBeenCalledWith("category", "==", "Baches");
    });
  });

  describe("getStats", () => {
    it("should aggregate reports by status and category", async () => {
      await seedReport("uuid-1", { status: ReportStatus.PENDING });
      await seedReport("uuid-2", { status: ReportStatus.PENDING });
      await seedReport("uuid-3", { status: ReportStatus.RESOLVED, category: "Luminarias" });

      const result = await repository.getStats();

      expect(result.total).toBe(3);
      expect(result.pendingCount).toBe(2);
      expect(result.inProgressCount).toBe(0);
      expect(result.resolvedCount).toBe(1);
      expect(result.byStatus).toEqual({ pending: 2, resolved: 1 });
      expect(result.byCategory).toEqual({ Baches: 2, Luminarias: 1 });
    });
  });
});
