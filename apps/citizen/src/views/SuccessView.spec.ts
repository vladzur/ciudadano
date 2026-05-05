import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createWebHistory } from "vue-router";
import SuccessView from "./SuccessView.vue";

describe("SuccessView", () => {
  it("should show success message", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: "/success", component: SuccessView }],
    });

    const wrapper = mount(SuccessView, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("¡Denuncia enviada!");
  });

  it("should show explanatory text", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: "/success", component: SuccessView }],
    });

    const wrapper = mount(SuccessView, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("equipo municipal lo revisará");
  });

  it("should have a button to return home", () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: "/success", component: SuccessView },
        { path: "/", component: { template: "<div>Home</div>" } },
      ],
    });

    const wrapper = mount(SuccessView, {
      global: { plugins: [router] },
    });

    const button = wrapper.find("button");
    expect(button.text()).toContain("Hacer otra denuncia");
  });

  it("should navigate to home when button is clicked", async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: "/success", component: SuccessView },
        { path: "/", component: { template: "<div>Home</div>" } },
      ],
    });

    const pushSpy = vi.spyOn(router, "push");
    const wrapper = mount(SuccessView, {
      global: { plugins: [router] },
    });

    await wrapper.find("button").trigger("click");

    expect(pushSpy).toHaveBeenCalledWith("/");
    pushSpy.mockRestore();
  });
});
