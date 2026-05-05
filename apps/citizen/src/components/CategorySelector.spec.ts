import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { CATEGORIES } from "@ciudadano/shared";
import CategorySelector from "./CategorySelector.vue";

describe("CategorySelector", () => {
  it("should render all categories", () => {
    const wrapper = mount(CategorySelector, {
      props: {
        categories: CATEGORIES,
        selected: "",
      },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(CATEGORIES.length);
  });

  it("should highlight the selected category", () => {
    const wrapper = mount(CategorySelector, {
      props: {
        categories: CATEGORIES,
        selected: CATEGORIES[0].value,
      },
    });

    const firstButton = wrapper.findAll("button")[0];
    expect(firstButton.classes()).toContain("border-green-600");
  });

  it("should emit select event when a category is clicked", async () => {
    const wrapper = mount(CategorySelector, {
      props: {
        categories: CATEGORIES,
        selected: "",
      },
    });

    await wrapper.findAll("button")[0].trigger("click");

    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual([CATEGORIES[0].value]);
  });

  it("should display category labels correctly", () => {
    const wrapper = mount(CategorySelector, {
      props: {
        categories: CATEGORIES,
        selected: "",
      },
    });

    expect(wrapper.text()).toContain("Luminarias");
    expect(wrapper.text()).toContain("Baches");
    expect(wrapper.text()).toContain("Aseo");
  });

  it("should not highlight any category when none selected", () => {
    const wrapper = mount(CategorySelector, {
      props: {
        categories: CATEGORIES,
        selected: "",
      },
    });

    const highlighted = wrapper.findAll(".border-green-600");
    expect(highlighted).toHaveLength(0);
  });
});
