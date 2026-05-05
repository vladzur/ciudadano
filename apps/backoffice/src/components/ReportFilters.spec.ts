import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ReportFilters from "./ReportFilters.vue";

describe("ReportFilters", () => {
  it("should render status and category select fields", () => {
    const wrapper = mount(ReportFilters);

    const selects = wrapper.findAll("select");
    expect(selects).toHaveLength(2);
  });

  it("should render clear filters button", () => {
    const wrapper = mount(ReportFilters);

    expect(wrapper.text()).toContain("Limpiar filtros");
  });

  it("should emit filter event when status changes", async () => {
    const wrapper = mount(ReportFilters);

    const statusSelect = wrapper.findAll("select")[0];
    await statusSelect.setValue("pending");

    expect(wrapper.emitted("filter")).toBeTruthy();
    expect(wrapper.emitted("filter")![0]).toEqual([{ status: "pending" }]);
  });

  it("should emit filter event when category changes", async () => {
    const wrapper = mount(ReportFilters);

    const categorySelect = wrapper.findAll("select")[1];
    await categorySelect.setValue("Baches");

    expect(wrapper.emitted("filter")).toBeTruthy();
    expect(wrapper.emitted("filter")![0]).toEqual([{ category: "Baches" }]);
  });

  it("should emit empty filter on clear", async () => {
    const wrapper = mount(ReportFilters);

    // Click "Limpiar filtros"
    await wrapper.find("button").trigger("click");

    const filterEvents = wrapper.emitted("filter");
    expect(filterEvents).toBeTruthy();
    const lastEvent = filterEvents![filterEvents!.length - 1];
    expect(lastEvent).toEqual([{}]);
  });
});
