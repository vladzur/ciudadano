import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MapSelector from "./MapSelector.vue";

// Mock de Leaflet para evitar dependencias del DOM real
vi.mock("leaflet", () => {
  const mockMarker = {
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    getLatLng: vi.fn().mockReturnValue({ lat: -39.2785, lng: -72.2284 }),
  };
  const mockTileLayer = { addTo: vi.fn().mockReturnThis() };
  const mockMapInstance = {
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    setView: vi.fn().mockReturnThis(),
  };

  return {
    default: {
      map: vi.fn(() => mockMapInstance),
      tileLayer: vi.fn(() => mockTileLayer),
      marker: vi.fn(() => mockMarker),
      Icon: {
        Default: {
          prototype: {} as any,
          mergeOptions: vi.fn(),
        },
      },
    },
    __mockMapInstance: mockMapInstance,
  };
});

describe("MapSelector", () => {
  it("should render the overlay with header and confirm button", () => {
    const wrapper = mount(MapSelector, {
      props: {
        initialLat: -39.2785,
        initialLng: -72.2284,
      },
    });

    expect(wrapper.text()).toContain("Mover el pin a la ubicación del incidente");
    expect(wrapper.text()).toContain("Confirmar ubicación");
  });

  it("should emit cancel when close button is clicked", async () => {
    const wrapper = mount(MapSelector, {
      props: {
        initialLat: -39.2785,
        initialLng: -72.2284,
      },
    });

    // El botón X es el primero en el header (el que tiene la ×)
    const buttons = wrapper.findAll("button");
    const closeButton = buttons[0]; // Primer botón es el de cerrar
    await closeButton.trigger("click");

    expect(wrapper.emitted("cancel")).toBeTruthy();
  });

  it("should emit confirm with current coordinates when confirm button is clicked", async () => {
    const wrapper = mount(MapSelector, {
      props: {
        initialLat: -39.2785,
        initialLng: -72.2284,
      },
    });

    // El botón de confirmar es el último (el verde "Confirmar ubicación")
    const buttons = wrapper.findAll("button");
    const confirmButton = buttons[buttons.length - 1];
    await confirmButton.trigger("click");

    expect(wrapper.emitted("confirm")).toBeTruthy();
    expect(wrapper.emitted("confirm")![0]).toEqual([-39.2785, -72.2284]);
  });

  it("should display the initial coordinates in the footer", () => {
    const wrapper = mount(MapSelector, {
      props: {
        initialLat: -39.2785,
        initialLng: -72.2284,
      },
    });

    expect(wrapper.text()).toContain("-39.27850");
    expect(wrapper.text()).toContain("-72.22840");
  });

  it("should apply fixed fullscreen overlay classes", () => {
    const wrapper = mount(MapSelector, {
      props: {
        initialLat: -39.2785,
        initialLng: -72.2284,
      },
    });

    const overlay = wrapper.find(".fixed.inset-0");
    expect(overlay.exists()).toBe(true);
  });
});
