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

  it("should show manual location text when isManual is true", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: -39.2785,
        longitude: -72.2284,
        loading: false,
        error: null,
        isManual: true,
      },
    });

    expect(wrapper.text()).toContain("Ubicación manual");
    expect(wrapper.text()).not.toContain("Ubicación obtenida");
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

    // El botón de reintentar tiene texto "Reintentar"
    const retryButton = wrapper.findAll("button").find((btn) => btn.text() === "Reintentar");
    expect(retryButton?.exists()).toBe(true);
    await retryButton?.trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
  });

  it("should emit openMap when map icon button is clicked", async () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: -39.2785,
        longitude: -72.2284,
        loading: false,
        error: null,
      },
    });

    // Buscar el botón del mapa (el que tiene el title "Seleccionar ubicación en el mapa")
    const allButtons = wrapper.findAll("button");
    // El botón del mapa siempre está presente (no tiene texto, solo SVG)
    const mapButton = allButtons.find((btn) => !btn.text() || btn.attributes("title") === "Seleccionar ubicación en el mapa");
    expect(mapButton?.exists()).toBe(true);
    await mapButton?.trigger("click");
    expect(wrapper.emitted("openMap")).toBeTruthy();
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

  it("should always show the map selector button even without errors", () => {
    const wrapper = mount(LocationDisplay, {
      props: {
        latitude: -39.2785,
        longitude: -72.2284,
        loading: false,
        error: null,
      },
    });

    // El botón del mapa siempre debe estar presente
    const mapButton = wrapper.find("button[title='Seleccionar ubicación en el mapa']");
    expect(mapButton.exists()).toBe(true);
  });
});
