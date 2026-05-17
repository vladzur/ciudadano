import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { useHeatmap } from "./useHeatmap.js";
import type { HeatmapPoint } from "@ciudadano/shared";

// Mock vue-router
const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock leaflet
const markerOnMock = vi.fn().mockReturnThis();
const markerMock = {
  on: markerOnMock,
};
const clusterGroupMock = {
  addLayer: vi.fn().mockReturnThis(),
  clearLayers: vi.fn(),
};

vi.mock("leaflet", () => {
  const mapMock = {
    setView: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    removeLayer: vi.fn().mockReturnThis(),
    addLayer: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      map: vi.fn().mockReturnValue(mapMock),
      tileLayer: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis(),
      }),
      marker: vi.fn().mockReturnValue(markerMock),
      markerClusterGroup: vi.fn().mockReturnValue(clusterGroupMock),
    },
  };
});

vi.mock("leaflet.markercluster", () => ({}));

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

  it("should create markerClusterGroup on mount", () => {
    createWrapper();

    expect(L.markerClusterGroup).toHaveBeenCalledWith(
      expect.objectContaining({ maxClusterRadius: 50 })
    );
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

    await new Promise((r) => setTimeout(r, 10));

    expect(result.loading.value).toBe(false);
  });

  it("should create markers for each point and add to cluster group", async () => {
    const points: HeatmapPoint[] = [
      { id: "uuid-1", lat: -39.2, lng: -72.2, intensity: 1 },
      { id: "uuid-2", lat: -39.3, lng: -72.3, intensity: 0.5 },
    ];
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockResolvedValue(points);

    createWrapper();

    await new Promise((r) => setTimeout(r, 10));

    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith([-39.2, -72.2]);
    expect(L.marker).toHaveBeenCalledWith([-39.3, -72.3]);
    expect(clusterGroupMock.addLayer).toHaveBeenCalledTimes(2);
  });

  it("should clear existing layers before rendering new markers", async () => {
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "uuid-1", lat: -39.2, lng: -72.2, intensity: 1 },
    ]);

    const { result } = createWrapper();
    await new Promise((r) => setTimeout(r, 10));

    // Segunda carga con diferentes datos
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "uuid-3", lat: -39.4, lng: -72.4, intensity: 1 },
    ]);
    await result.loadHeatmapData({ category: "Seguridad" });

    expect(clusterGroupMock.clearLayers).toHaveBeenCalled();
  });

  it("should navigate to report detail on marker click", async () => {
    const points: HeatmapPoint[] = [
      { id: "uuid-1", lat: -39.2, lng: -72.2, intensity: 1 },
    ];
    (fetchHeatmapData as ReturnType<typeof vi.fn>).mockResolvedValue(points);

    createWrapper();

    await new Promise((r) => setTimeout(r, 10));

    // Verificar que se registró el handler click
    expect(markerOnMock).toHaveBeenCalledWith("click", expect.any(Function));

    // Simular el click
    const clickHandler = markerOnMock.mock.calls[0][1];
    clickHandler();

    expect(mockPush).toHaveBeenCalledWith("/reports/uuid-1");
  });
});
