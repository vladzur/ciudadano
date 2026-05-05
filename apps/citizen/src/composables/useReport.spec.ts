import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReport } from "./useReport.js";

// Mock del servicio API
vi.mock("../services/api", () => ({
  submitReport: vi.fn(),
}));

import { submitReport } from "../services/api";

describe("useReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReportData = {
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

  it("should start with initial state", () => {
    const { loading, error, report } = useReport();

    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(report.value).toBeNull();
  });

  it("should set loading to true during send", async () => {
    (submitReport as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10))
    );
    const { loading, send } = useReport();

    const promise = send(mockReportData);
    expect(loading.value).toBe(true);

    await promise;
  });

  it("should set loading to false after successful send", async () => {
    (submitReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    const { loading, send } = useReport();

    await send(mockReportData);

    expect(loading.value).toBe(false);
  });

  it("should update report on success and return true", async () => {
    (submitReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    const { report, send } = useReport();

    const result = await send(mockReportData);

    expect(result).toBe(true);
    expect(report.value).toEqual(mockResponse);
  });

  it("should set error on API failure and return false", async () => {
    (submitReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );
    const { error, send, loading } = useReport();

    const result = await send(mockReportData);

    expect(result).toBe(false);
    expect(error.value).toBe("Network error");
    expect(loading.value).toBe(false);
  });

  it("should set default message for non-Error exceptions", async () => {
    (submitReport as ReturnType<typeof vi.fn>).mockRejectedValue("Unknown string error");
    const { error, send } = useReport();

    await send(mockReportData);

    expect(error.value).toBe("Error al enviar la denuncia. Intente nuevamente.");
  });

  it("should clear previous error on new send attempt", async () => {
    (submitReport as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce(mockResponse);

    const { error, send } = useReport();

    await send(mockReportData);
    expect(error.value).toBe("First error");

    await send(mockReportData);
    expect(error.value).toBeNull();
  });

  it("should send image file when provided", async () => {
    (submitReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    const { send } = useReport();

    const imageFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    await send({ ...mockReportData, image: imageFile });

    expect(submitReport).toHaveBeenCalledWith({
      ...mockReportData,
      image: imageFile,
    });
  });
});
