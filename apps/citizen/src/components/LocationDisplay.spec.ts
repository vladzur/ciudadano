import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LocationDisplay from "./LocationDisplay.vue";

describe("LocationDisplay", () => {
  it("should show coordinates when available", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: -39.2785,
        longitude: -72.2284,
        loading: false,
        error: null,
      },
    });

    expect(wrapper.text()).toContain("Ubicación obtenida");
    expect(wrapper.text()).toContain("-39.2785");
    expect(wrapper.text()).toContain("-72.2284");
  });

  it("should show loading state", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: null,
        longitude: null,
        loading: true,
        error: null,
      },
    });

    expect(wrapper.text()).toContain("Obteniendo ubicación");
  });

  it("should show error message when present", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: null,
        longitude: null,
        loading: false,
        error: "Permiso de ubicación denegado",
      },
    });

    expect(wrapper.text()).toContain("Permiso de ubicación denegado");
  });

  it("should show retry button when there is an error", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: null,
        longitude: null,
        loading: false,
        error: "Error al obtener la ubicación",
      },
    });

    expect(wrapper.text()).toContain("Reintentar");
  });

  it("should emit retry event when retry button is clicked", async () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: null,
        longitude: null,
        loading: false,
        error: "Error",
      },
    });

    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
  });

  it("should show default message when no coordinates and no error", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: null,
        longitude: null,
        loading: false,
        error: null,
      },
    });

    expect(wrapper.text()).toContain("Sin ubicación");
  });

  it("should not show retry button when there is no error", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: -39.2785,
        longitude: -72.2284,
        loading: false,
        error: null,
      },
    });

    expect(wrapper.find("button").exists()).toBe(false);
  });
});
