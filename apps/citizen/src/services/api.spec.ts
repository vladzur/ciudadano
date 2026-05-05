import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { submitReport } from "./api.js";

vi.mock("axios", () => {
  const mockInstance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn().mockReturnValue(mockInstance),
    },
  };
});

describe("Citizen API Service", () => {
  let mockApi: ReturnType<typeof axios.create>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = axios.create();
  });

  describe("submitReport", () => {
    const reportData = {
      description: "Bache profundo en la calle",
      category: "Baches",
      latitude: -39.2785,
      longitude: -72.2284,
    };

    const mockResponse = {
      id: "uuid-1",
      description: "Bache profundo en la calle",
      location: { lat: -39.2785, lng: -72.2284 },
      image_url: null,
      category: "Baches",
      status: "pending",
      created_at: "2025-01-15T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
    };

    it("should send report as FormData and return IReport", async () => {
      (mockApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      mockApi.post = vi.fn().mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await submitReport(reportData);

      expect(mockApi.post).toHaveBeenCalledWith(
        "/reports",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include image in FormData when provided", async () => {
      (mockApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const imageFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      await submitReport({ ...reportData, image: imageFile });

      const formData = (mockApi.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData;
      expect(formData.get("image")).toBeInstanceOf(File);
      expect(formData.get("image")?.name).toBe("photo.jpg");
    });

    it("should not include image field when no image provided", async () => {
      (mockApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      await submitReport(reportData);

      const formData = (mockApi.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData;
      expect(formData.get("image")).toBeNull();
    });

    it("should send coordinates as strings in FormData", async () => {
      (mockApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      await submitReport(reportData);

      const formData = (mockApi.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData;
      expect(formData.get("latitude")).toBe("-39.2785");
      expect(formData.get("longitude")).toBe("-72.2284");
    });

    it("should propagate network errors", async () => {
      (mockApi.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error")
      );

      await expect(submitReport(reportData)).rejects.toThrow("Network error");
    });
  });
});
