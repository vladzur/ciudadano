import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import CameraCapture from "./CameraCapture.vue";

describe("CameraCapture", () => {
  let mockStream: MediaStream;

  beforeEach(() => {
    mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    } as unknown as MediaStream;

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
      writable: true,
    });

    // Mock HTMLVideoElement.play
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
      writable: true,
    });
  });

  it("should render cancel and capture buttons", () => {
    const wrapper = mount(CameraCapture);

    // El botón de cancelar y el botón de captura están presentes
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("should render video element", () => {
    const wrapper = mount(CameraCapture);

    expect(wrapper.find("video").exists()).toBe(true);
  });

  it('should emit cancel event when clicking "Cancelar"', async () => {
    const wrapper = mount(CameraCapture);

    // Esperar a que getUserMedia se resuelva
    await new Promise((r) => setTimeout(r, 10));

    const cancelBtn = wrapper.findAll("button")[0];
    await cancelBtn.trigger("click");

    expect(wrapper.emitted("cancel")).toBeTruthy();
  });

  it("should show error message when camera access fails", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Permission denied")
    );

    const wrapper = mount(CameraCapture);

    // Esperar a que el catch en onMounted se ejecute
    await new Promise((r) => setTimeout(r, 10));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Permission denied");
  });

  it("should offer text-only fallback when camera fails", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("NotAllowedError")
    );

    const wrapper = mount(CameraCapture);

    await new Promise((r) => setTimeout(r, 10));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Usar formulario sin foto");
  });
});
