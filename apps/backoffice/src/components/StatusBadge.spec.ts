import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatusBadge from "./StatusBadge.vue";
import { ReportStatus } from "@ciudadano/shared";

describe("StatusBadge", () => {
  it("should render pending status with yellow styling", () => {
    const wrapper = mount(StatusBadge, {
      props: { status: ReportStatus.PENDING },
    });

    expect(wrapper.text()).toBe("Pendiente");
    expect(wrapper.classes()).toContain("bg-yellow-100");
    expect(wrapper.classes()).toContain("text-yellow-800");
  });

  it("should render in_progress status with blue styling", () => {
    const wrapper = mount(StatusBadge, {
      props: { status: ReportStatus.IN_PROGRESS },
    });

    expect(wrapper.text()).toBe("En Gestión");
    expect(wrapper.classes()).toContain("bg-blue-100");
    expect(wrapper.classes()).toContain("text-blue-800");
  });

  it("should render resolved status with green styling", () => {
    const wrapper = mount(StatusBadge, {
      props: { status: ReportStatus.RESOLVED },
    });

    expect(wrapper.text()).toBe("Resuelto");
    expect(wrapper.classes()).toContain("bg-green-100");
    expect(wrapper.classes()).toContain("text-green-800");
  });
});
