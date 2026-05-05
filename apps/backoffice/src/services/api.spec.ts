import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
});

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPatch = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn().mockReturnValue({
      post: (...args: any[]) => mockPost(...args),
      get: (...args: any[]) => mockGet(...args),
      patch: (...args: any[]) => mockPatch(...args),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

describe("Backoffice API Service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.keys(store).forEach(k => delete store[k]);
  });

  it("should POST to /auth/login", async () => {
    const { login } = await import("../services/api.js");
    mockPost.mockResolvedValue({
      data: { success: true, data: { accessToken: "at", refreshToken: "rt", user: {} } },
    });

    const result = await login("admin@test.cl", "secret");

    expect(mockPost).toHaveBeenCalledWith("/auth/login", {
      email: "admin@test.cl",
      password: "secret",
    });
    expect(result.accessToken).toBe("at");
    expect(result.refreshToken).toBe("rt");
  });

  it("should GET /reports with params", async () => {
    const { fetchReports } = await import("../services/api.js");
    mockGet.mockResolvedValue({
      data: { success: true, data: [], meta: {} },
    });

    await fetchReports({ page: 1, limit: 10 });

    expect(mockGet).toHaveBeenCalledWith("/reports", { params: { page: 1, limit: 10 } });
  });

  it("should GET /reports/:id", async () => {
    const { fetchReportById } = await import("../services/api.js");
    mockGet.mockResolvedValue({
      data: { success: true, data: {} },
    });

    await fetchReportById("uuid-1");

    expect(mockGet).toHaveBeenCalledWith("/reports/uuid-1");
  });

  it("should PATCH /reports/:id/status", async () => {
    const { updateReportStatus } = await import("../services/api.js");
    mockPatch.mockResolvedValue({
      data: { success: true, data: {} },
    });

    await updateReportStatus("uuid-1", "in_progress");

    expect(mockPatch).toHaveBeenCalledWith("/reports/uuid-1/status", {
      status: "in_progress",
    });
  });

  it("should POST /reports/:id/notes", async () => {
    const { createNote } = await import("../services/api.js");
    mockPost.mockResolvedValue({
      data: { success: true, data: {} },
    });

    await createNote("uuid-1", "Nota");

    expect(mockPost).toHaveBeenCalledWith("/reports/uuid-1/notes", {
      content: "Nota",
    });
  });

  it("should GET /reports/analytics/heatmap", async () => {
    const { fetchHeatmapData } = await import("../services/api.js");
    mockGet.mockResolvedValue({
      data: { success: true, data: [] },
    });

    await fetchHeatmapData({ startDate: "2025-01-01" });

    expect(mockGet).toHaveBeenCalledWith("/reports/analytics/heatmap", {
      params: { startDate: "2025-01-01" },
    });
  });

  it("should GET /reports/analytics/stats", async () => {
    const { fetchStats } = await import("../services/api.js");
    mockGet.mockResolvedValue({
      data: { success: true, data: {} },
    });

    await fetchStats();

    expect(mockGet).toHaveBeenCalledWith("/reports/analytics/stats");
  });

  it("should GET /storage/signed-url/:key", async () => {
    const { getSignedUrl } = await import("../services/api.js");
    mockGet.mockResolvedValue({
      data: { success: true, data: { url: "https://signed.url" } },
    });

    const url = await getSignedUrl("reports/uuid.jpg");

    expect(mockGet).toHaveBeenCalledWith("/storage/signed-url/reports/uuid.jpg");
    expect(url).toBe("https://signed.url");
  });
});
