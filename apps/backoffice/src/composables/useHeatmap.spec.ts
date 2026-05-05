import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { useHeatmap } from "./useHeatmap.js";
import type { HeatmapPoint } from "@ciudadano/shared";

// Mock leaflet
vi.mock("leaflet", () => {
  const mapMock = {
    setView: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    removeLayer: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      map: vi.fn().mockReturnValue(mapMock),
      tileLayer: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis(),
      }),
    },
  };
});

vi.mock("leaflet.heat", () => ({}));

// Mock API
vi.mock("../services/api", () => ({
  fetchHeatmapData: vi.fn(),
}));

import L from "leaflet";
import { fetchHeatmapData } from "../services/api";

// Wrapper component that uses the composable
function createWrapper(containerId = "heatmap-container") {
  let composableResult: ReturnType<typeof useHeatmap> | null = null;

  const TestComponent = defineComponent({
    setup() {
      composableResult = useHeatmap(containerId);
      return () => h("div", { id: containerId });
    },
  });

  const wrapper = mount(TestComponent);
  return { wrapper, result: composableResult! };
}

describe("useHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock document.getElementById
    const mockContainer = document.createElement("div");
    mockContainer.id = "heatmap-container";
    mockContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      toJSON: () => {},
    });
    vi.spyOn(document, "getElementById").mockReturnValue(mockContainer);
  });

  it("should initialize map on mount", () => {
    const { result } = createWrapper();

    expect(result.mapLoaded.value).toBe(true);
    expect(L.map).toHaveBeenCalled();
  });

  it("should call loadHeatmapData on mount", () => {
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    createWrapper();

    expect(fetchHeatmapData).toHaveBeenCalled();
  });

  it("should set error when loadHeatmapData fails", async () => {
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("API error"));
    const { result } = createWrapper();

    // Wait for the rejected promise to be handled
    await new Promise((r) => setTimeout(r, 10));

    expect(result.error.value).toBe("API error");
  });

  it("should set loading to false after load", async () => {
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const { result } = createWrapper();

    // Esperar a que la promesa se resuelva
    await new Promise((r) => setTimeout(r, 10));

    expect(result.loading.value).toBe(false);
  });
});
