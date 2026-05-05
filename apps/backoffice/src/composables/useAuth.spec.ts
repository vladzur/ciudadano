import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuth } from "./useAuth.js";

// Mock del store
vi.mock("../stores/auth", () => ({
  useAuthStore: vi.fn(),
}));

// Mock de vue-router
vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
}));

import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

describe("useAuth", () => {
  const mockPush = vi.fn();
  const mockStoreLogin = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockStoreLogin,
    });
  });

  it("should start with no error and no loading", () => {
    const { error, loading } = useAuth();

    expect(error.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it("should call store login and navigate to / on success", async () => {
    mockStoreLogin.mockResolvedValue(undefined);
    const { login, loading, error } = useAuth();

    await login("admin@test.cl", "secret123");

    expect(mockStoreLogin).toHaveBeenCalledWith("admin@test.cl", "secret123");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("should set loading true during login", () => {
    mockStoreLogin.mockImplementation(() => new Promise(() => {}));
    const { login, loading } = useAuth();

    login("admin@test.cl", "secret123");

    expect(loading.value).toBe(true);
  });

  it("should set error on login failure", async () => {
    mockStoreLogin.mockRejectedValue(new Error("Invalid credentials"));
    const { login, error, loading } = useAuth();

    await login("admin@test.cl", "wrong");

    expect(error.value).toBe("Invalid credentials");
    expect(loading.value).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should set default error message for unknown errors", async () => {
    mockStoreLogin.mockRejectedValue("Unknown error");
    const { login, error } = useAuth();

    await login("admin@test.cl", "wrong");

    expect(error.value).toBe("Error de autenticación.");
  });
});
