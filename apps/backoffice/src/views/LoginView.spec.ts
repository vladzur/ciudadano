import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

// Mock del composable useAuth
const mockLogin = vi.fn();
const mockError = vi.fn(() => null);
const mockLoading = vi.fn(() => false);

vi.mock("../composables/useAuth", () => ({
  useAuth: () => ({
    error: { value: mockError() },
    loading: { value: mockLoading() },
    login: mockLogin,
  }),
}));

import LoginView from "./LoginView.vue";

describe("LoginView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should render login form with email and password fields", () => {
    const wrapper = mount(LoginView);

    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Backoffice");
    expect(wrapper.text()).toContain("Denuncia Ciudadana Villarrica");
  });

  it("should call login on form submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    const wrapper = mount(LoginView);

    await wrapper.find('input[type="email"]').setValue("admin@test.cl");
    await wrapper.find('input[type="password"]').setValue("secret123");
    await wrapper.find("form").trigger("submit.prevent");

    expect(mockLogin).toHaveBeenCalledWith("admin@test.cl", "secret123");
  });

  it("should show error message when present", () => {
    mockError.mockReturnValue("Credenciales inválidas");

    const wrapper = mount(LoginView);

    expect(wrapper.text()).toContain("Credenciales inválidas");
  });

  it("should show loading text when loading", () => {
    mockLoading.mockReturnValue(true);

    const wrapper = mount(LoginView);

    expect(wrapper.text()).toContain("Ingresando");
  });
});
