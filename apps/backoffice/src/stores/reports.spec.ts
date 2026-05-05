import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useReportsStore } from "./reports.js";

// Mock del servicio API
vi.mock("../services/api", () => ({
  fetchReports: vi.fn(),
  fetchReportById: vi.fn(),
  updateReportStatus: vi.fn(),
  createNote: vi.fn(),
  fetchStats: vi.fn(),
}));

import {
  fetchReports,
  fetchReportById,
  updateReportStatus,
  createNote,
  fetchStats,
} from "../services/api";

describe("useReportsStore", () => {
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

  const mockNotes = [
    { id: "note-1", report_id: "uuid-1", content: "Nota 1", created_by: "admin", created_at: "2025-01-15T00:00:00Z" },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("loadReports", () => {
    it("should load paginated reports", async () => {
      const paginatedResult = {
        success: true,
        data: [mockReport],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      (fetchReports as ReturnType<typeof vi.fn>).mockResolvedValue(paginatedResult);
      const store = useReportsStore();

      await store.loadReports();

      expect(store.reports).toEqual([mockReport]);
      expect(store.total).toBe(1);
      expect(store.page).toBe(1);
      expect(store.totalPages).toBe(1);
      expect(store.loading).toBe(false);
    });

    it("should pass filters to API", async () => {
      (fetchReports as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
      const store = useReportsStore();

      await store.loadReports({ status: "pending" as any, category: "Baches" });

      expect(fetchReports).toHaveBeenCalledWith({
        status: "pending",
        category: "Baches",
      });
    });

    it("should set error on failure", async () => {
      (fetchReports as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
      const store = useReportsStore();

      await store.loadReports();

      expect(store.error).toBe("Network error");
    });

    it("should set loading true during fetch and false after", async () => {
      (fetchReports as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      const store = useReportsStore();

      const promise = store.loadReports();
      expect(store.loading).toBe(true);
      await promise;
      expect(store.loading).toBe(false);
    });
  });

  describe("loadReportDetail", () => {
    it("should load report detail with notes", async () => {
      const reportWithNotes = { ...mockReport, notes: mockNotes };
      (fetchReportById as ReturnType<typeof vi.fn>).mockResolvedValue(reportWithNotes);
      const store = useReportsStore();

      await store.loadReportDetail("uuid-1");

      expect(store.selectedReport).toEqual(reportWithNotes);
      expect(fetchReportById).toHaveBeenCalledWith("uuid-1");
    });

    it("should set error on failure", async () => {
      (fetchReportById as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Not found"));
      const store = useReportsStore();

      await store.loadReportDetail("uuid-1");

      expect(store.error).toBe("Not found");
    });
  });

  describe("changeStatus", () => {
    it("should update status and reflect in selectedReport", async () => {
      (updateReportStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { ...mockReport, status: "in_progress" },
      });
      const store = useReportsStore();
      store.selectedReport = { ...mockReport, notes: [] };

      await store.changeStatus("uuid-1", "in_progress");

      expect(updateReportStatus).toHaveBeenCalledWith("uuid-1", "in_progress");
      expect(store.selectedReport?.status).toBe("in_progress");
    });

    it("should update item in reports list when present", async () => {
      (updateReportStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { ...mockReport, status: "resolved" },
      });
      const store = useReportsStore();
      store.reports = [mockReport];

      await store.changeStatus("uuid-1", "resolved");

      expect(store.reports[0].status).toBe("resolved");
    });

    it("should set error on failure", async () => {
      (updateReportStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Failed"));
      const store = useReportsStore();

      await store.changeStatus("uuid-1", "resolved");

      expect(store.error).toBe("Failed");
    });
  });

  describe("addNote", () => {
    it("should prepend note to selectedReport.notes", async () => {
      const newNote = {
        id: "note-2",
        report_id: "uuid-1",
        content: "Nueva nota",
        created_by: "admin",
        created_at: "2025-01-16T00:00:00Z",
      };
      (createNote as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: newNote,
      });
      const store = useReportsStore();
      store.selectedReport = { ...mockReport, notes: [...mockNotes] };

      await store.addNote("uuid-1", "Nueva nota");

      expect(createNote).toHaveBeenCalledWith("uuid-1", "Nueva nota");
      expect(store.selectedReport?.notes).toHaveLength(2);
      expect(store.selectedReport?.notes[0]).toEqual(newNote);
    });

    it("should set error on failure", async () => {
      (createNote as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Failed"));
      const store = useReportsStore();

      await store.addNote("uuid-1", "Nota");

      expect(store.error).toBe("Failed");
    });
  });

  describe("loadStats", () => {
    it("should load dashboard stats", async () => {
      const mockStats = {
        total: 10,
        byStatus: { pending: 5, in_progress: 3, resolved: 2 },
        byCategory: { Baches: 6, Luminarias: 4 },
        pendingCount: 5,
        inProgressCount: 3,
        resolvedCount: 2,
      };
      (fetchStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);
      const store = useReportsStore();

      await store.loadStats();

      expect(store.stats).toEqual(mockStats);
      expect(fetchStats).toHaveBeenCalled();
    });

    it("should set error on failure", async () => {
      (fetchStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Failed"));
      const store = useReportsStore();

      await store.loadStats();

      expect(store.error).toBe("Failed");
    });
  });
});
