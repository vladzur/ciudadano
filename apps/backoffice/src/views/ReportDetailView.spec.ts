import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { useReportsStore } from "../stores/reports";
import ReportDetailView from "./ReportDetailView.vue";

// Mock vue-router
const mockPush = vi.fn();
const mockRoute = {
  params: { id: "uuid-1" },
};

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

// Mock signed URL
vi.mock("../services/api", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed.url/photo.jpg"),
}));

describe("ReportDetailView", () => {
  const mockReport = {
    id: "uuid-1",
    description: "Bache profundo en la calle principal que causa accidentes",
    location: { lat: -39.2785, lng: -72.2284 },
    image_url: "reports/uuid.jpg",
    category: "Baches",
    status: "pending",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  };

  const mockNotes = [
    {
      id: "note-1",
      report_id: "uuid-1",
      content: "Se inició gestión",
      created_by: "admin@test.cl",
      created_at: "2025-01-16T00:00:00Z",
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should render back button", () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.text()).toContain("Volver a lista");
  });

  it("should show loading state", () => {
    const store = useReportsStore();
    store.loading = true;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.text()).toContain("Cargando denuncia");
  });

  it("should show error when present", () => {
    const store = useReportsStore();
    store.error = "Error al cargar detalle";

    const wrapper = mount(ReportDetailView);

    expect(wrapper.text()).toContain("Error al cargar detalle");
  });

  it("should render report details when loaded", () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.text()).toContain("Baches");
    expect(wrapper.text()).toContain(mockReport.description);
    expect(wrapper.text()).toContain("uuid-1");
  });

  it("should render StatusBadge", () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.findComponent({ name: "StatusBadge" }).exists()).toBe(true);
  });

  it("should render NotesTimeline", () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.findComponent({ name: "NotesTimeline" }).exists()).toBe(true);
  });

  it("should navigate back to reports list", async () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    await wrapper.find("button").trigger("click");

    expect(mockPush).toHaveBeenCalledWith("/reports");
  });

  it("should show status change buttons", () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.text()).toContain("Cambiar Estado");
    expect(wrapper.text()).toContain("Pendiente");
    expect(wrapper.text()).toContain("En Gestión");
    expect(wrapper.text()).toContain("Resuelto");
  });

  it("should render note input and add button", () => {
    const store = useReportsStore();
    store.selectedReport = { ...mockReport, notes: mockNotes } as any;
    store.loading = false;

    const wrapper = mount(ReportDetailView);

    expect(wrapper.text()).toContain("Agregar");
    expect(wrapper.find('input[placeholder*="Añadir nota"]').exists()).toBe(true);
  });
});
