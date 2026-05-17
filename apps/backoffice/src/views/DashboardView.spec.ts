import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { useReportsStore } from "../stores/reports";
import DashboardView from "./DashboardView.vue";

// Mock vue-router
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock leaflet
vi.mock("leaflet", () => ({
  default: {
    map: vi.fn().mockReturnValue({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      removeLayer: vi.fn().mockReturnThis(),
      addLayer: vi.fn().mockReturnThis(),
    }),
    tileLayer: vi.fn().mockReturnValue({
      addTo: vi.fn().mockReturnThis(),
    }),
    marker: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
    }),
    markerClusterGroup: vi.fn().mockReturnValue({
      addLayer: vi.fn().mockReturnThis(),
      clearLayers: vi.fn(),
    }),
  },
}));

vi.mock("leaflet.markercluster", () => ({}));

// Mock API
vi.mock("../services/api", () => ({
  fetchHeatmapData: vi.fn().mockResolvedValue([]),
}));

describe("DashboardView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Mock document.getElementById for heatmap
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

  it("should render dashboard title", () => {
    const wrapper = mount(DashboardView);

    expect(wrapper.text()).toContain("Dashboard de Gestión");
  });

  it("should render KPI cards", () => {
    const store = useReportsStore();
    store.stats = {
      total: 50,
      byStatus: { pending: 20, in_progress: 15, resolved: 15 },
      byCategory: { Baches: 30, Luminarias: 20 },
      pendingCount: 20,
      inProgressCount: 15,
      resolvedCount: 15,
    };

    const wrapper = mount(DashboardView);

    expect(wrapper.text()).toContain("Total Denuncias");
    expect(wrapper.text()).toContain("50");
    expect(wrapper.text()).toContain("Pendientes");
    expect(wrapper.text()).toContain("20");
    expect(wrapper.text()).toContain("En Gestión");
    expect(wrapper.text()).toContain("15");
    expect(wrapper.text()).toContain("Resueltas");
    expect(wrapper.text()).toContain("15");
  });

  it("should render map container", () => {
    const wrapper = mount(DashboardView);

    expect(wrapper.find("#heatmap-container-wrapper").exists()).toBe(true);
  });

  it("should render map title as Mapa de Denuncias", () => {
    const wrapper = mount(DashboardView);

    expect(wrapper.text()).toContain("Mapa de Denuncias");
  });

  it("should render category filter buttons", () => {
    const wrapper = mount(DashboardView);

    expect(wrapper.text()).toContain("Todas");
    expect(wrapper.text()).toContain("Seguridad");
    expect(wrapper.text()).toContain("Baches");
  });
});
