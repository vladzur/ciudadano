import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./HomeView.vue";

// Mock de los composables usados por ReportForm
vi.mock("../composables/useGeolocation", () => ({
  useGeolocation: () => ({
    latitude: { value: null },
    longitude: { value: null },
    error: { value: null },
    loading: { value: false },
    getPosition: vi.fn(),
  }),
}));

vi.mock("../composables/useCamera", () => ({
  useCamera: () => ({
    photoBlob: { value: null },
    isActive: { value: false },
    startCamera: vi.fn(),
    capturePhoto: vi.fn(),
    stopCamera: vi.fn(),
  }),
}));

vi.mock("../composables/useReport", () => ({
  useReport: () => ({
    loading: { value: false },
    error: { value: null },
    report: { value: null },
    send: vi.fn(),
  }),
}));

describe("HomeView", () => {
  it("should render header text", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: "/", component: HomeView }],
    });

    const wrapper = mount(HomeView, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Denuncia Ciudadana");
    expect(wrapper.text()).toContain("Villarrica");
  });

  it("should render the ReportForm component", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: "/", component: HomeView }],
    });

    const wrapper = mount(HomeView, {
      global: { plugins: [router] },
    });

    expect(wrapper.findComponent({ name: "ReportForm" }).exists()).toBe(true);
  });

  it("should show descriptive subtitle", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: "/", component: HomeView }],
    });

    const wrapper = mount(HomeView, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Reporta incidentes urbanos");
  });
});
