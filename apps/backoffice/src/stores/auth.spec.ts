import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { UserRole, AdminUserStatus } from "@ciudadano/shared";
import { useAuthStore } from "./auth.js";

// Mock del servicio API
vi.mock("../services/api", () => ({
  login: vi.fn(),
}));

import { login as apiLogin } from "../services/api";

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with null user and tokens from localStorage", () => {
    localStorage.setItem("accessToken", "stored-token");
    localStorage.setItem("refreshToken", "stored-refresh");

    const store = useAuthStore();

    expect(store.accessToken).toBe("stored-token");
    expect(store.refreshToken).toBe("stored-refresh");
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(true);
  });

  it("should initialize isAuthenticated as false when no tokens", () => {
    const store = useAuthStore();

    expect(store.isAuthenticated).toBe(false);
    expect(store.accessToken).toBeNull();
  });

  describe("login", () => {
    const mockLoginResponse = {
      accessToken: "access-token-xyz",
      refreshToken: "refresh-token-xyz",
      user: {
        id: "uuid-1",
        email: "admin@villarrica.cl",
        name: "Admin",
        role: "admin" as const,
        status: AdminUserStatus.ACTIVE,
        created_at: "2025-01-01T00:00:00Z",
      },
    };

    it("should set tokens and user on successful login", async () => {
      (apiLogin as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);
      const store = useAuthStore();

      await store.login("admin@villarrica.cl", "secret123");

      expect(apiLogin).toHaveBeenCalledWith("admin@villarrica.cl", "secret123");
      expect(store.accessToken).toBe("access-token-xyz");
      expect(store.refreshToken).toBe("refresh-token-xyz");
      expect(store.user).toEqual(mockLoginResponse.user);
      expect(store.isAuthenticated).toBe(true);
    });

    it("should save tokens to localStorage", async () => {
      (apiLogin as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);
      const store = useAuthStore();

      await store.login("admin@villarrica.cl", "secret123");

      expect(localStorage.getItem("accessToken")).toBe("access-token-xyz");
      expect(localStorage.getItem("refreshToken")).toBe("refresh-token-xyz");
    });

    it("should propagate errors on failed login", async () => {
      (apiLogin as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Invalid credentials"));
      const store = useAuthStore();

      await expect(store.login("x", "x")).rejects.toThrow("Invalid credentials");
      expect(store.accessToken).toBeNull();
      expect(store.user).toBeNull();
    });
  });

  describe("logout", () => {
    it("should clear state and localStorage", () => {
      localStorage.setItem("accessToken", "test");
      localStorage.setItem("refreshToken", "test");
      const store = useAuthStore();
      store.$patch({ accessToken: "test", refreshToken: "test", user: { id: "1", email: "a@b.cl", name: "X", role: UserRole.ADMIN, status: AdminUserStatus.ACTIVE, created_at: "2025-01-01T00:00:00Z" } });

      store.logout();

      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
    });
  });
});
