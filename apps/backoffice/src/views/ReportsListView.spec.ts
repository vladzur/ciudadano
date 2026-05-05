import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { useReportsStore } from "../stores/reports";
import ReportsListView from "./ReportsListView.vue";

// Mock vue-router
const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("ReportsListView", () => {
  const mockReport = {
    id: "uuid-1",
    description: "Bache profundo en la calle principal",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: null,
    category: "Baches",
    status: "pending",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should render page title", () => {
    const wrapper = mount(ReportsListView);

    expect(wrapper.text()).toContain("Denuncias Recibidas");
  });

  it("should render ReportFilters component", () => {
    const wrapper = mount(ReportsListView);

    expect(wrapper.findComponent({ name: "ReportFilters" }).exists()).toBe(true);
  });

  it("should show loading state", () => {
    const store = useReportsStore();
    store.loading = true;

    const wrapper = mount(ReportsListView);

    expect(wrapper.text()).toContain("Cargando denuncias");
  });

  it("should render report list", () => {
    const store = useReportsStore();
    store.reports = [mockReport as any];
    store.total = 1;

    const wrapper = mount(ReportsListView);

    expect(wrapper.text()).toContain("Baches");
    expect(wrapper.text()).toContain("1 resultados");
  });

  it("should show empty state when no reports", () => {
    const store = useReportsStore();
    store.reports = [];
    store.loading = false;

    const wrapper = mount(ReportsListView);

    expect(wrapper.text()).toContain("No se encontraron denuncias");
  });

  it("should show error when present", () => {
    const store = useReportsStore();
    store.error = "Error al cargar";

    const wrapper = mount(ReportsListView);

    expect(wrapper.text()).toContain("Error al cargar");
  });

  it("should navigate to detail on row click", async () => {
    const store = useReportsStore();
    store.reports = [mockReport as any];

    const wrapper = mount(ReportsListView);

    // Click on first row
    const rows = wrapper.findAll("tbody tr");
    await rows[0].trigger("click");

    expect(mockPush).toHaveBeenCalledWith("/reports/uuid-1");
  });
});
