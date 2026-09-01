import { NotFoundException } from "@nestjs/common";
import { AdminUserStatus, UserRole } from "@ciudadano/shared";
import type { Firestore } from "firebase-admin/firestore";
import { AdminUsersRepository } from "./admin-users.repository.js";
import {
  createMockFirestore,
  mockTimestamp,
  type MockFirestore,
} from "../../testing/firestore.mock.js";

describe("AdminUsersRepository", () => {
  let db: MockFirestore;
  let repository: AdminUsersRepository;

  const adminData = {
    email: "admin@villarrica.cl",
    password: "hashed-password",
    name: "Administrador",
    role: "admin",
    status: "active",
    createdAt: mockTimestamp("2025-01-01T00:00:00Z"),
  };

  beforeEach(() => {
    db = createMockFirestore();
    repository = new AdminUsersRepository(db as unknown as Firestore);
  });

  describe("findByEmail", () => {
    it("should return user with password when found", async () => {
      await db.collection("admin_users").doc("uuid-1").set(adminData);

      const result = await repository.findByEmail("admin@villarrica.cl");

      expect(result).toEqual({
        id: "uuid-1",
        email: "admin@villarrica.cl",
        name: "Administrador",
        role: "admin",
        status: "active",
        created_at: "2025-01-01T00:00:00.000Z",
        password: "hashed-password",
      });
    });

    it("should return null when not found", async () => {
      const result = await repository.findByEmail("nadie@test.cl");

      expect(result).toBeNull();
    });
  });

  describe("emailExists", () => {
    it("should return true when email is registered", async () => {
      await db.collection("admin_users").doc("uuid-1").set(adminData);

      const result = await repository.emailExists("admin@villarrica.cl");

      expect(result).toBe(true);
    });

    it("should return false when email is not registered", async () => {
      const result = await repository.emailExists("nadie@test.cl");

      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("should create user with pending status and staff role", async () => {
      const result = await repository.create({
        email: "new@test.cl",
        password: "hash",
        name: "Nuevo",
      });

      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.status).toBe("pending");
      expect(result.role).toBe("staff");
      // El hash se guarda pero no se expone en la respuesta
      expect(result).not.toHaveProperty("password");
      const stored = db.__store.get("admin_users")!.get(result.id)!;
      expect(stored.password).toBe("hash");
    });
  });

  describe("findAll", () => {
    it("should return all users mapped without password", async () => {
      await db.collection("admin_users").doc("uuid-1").set(adminData);
      await db.collection("admin_users").doc("uuid-2").set({
        ...adminData,
        email: "staff@test.cl",
        role: "staff",
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("password");
      expect(result.map((user) => user.email)).toEqual(
        expect.arrayContaining(["admin@villarrica.cl", "staff@test.cl"])
      );
    });
  });

  describe("updateStatus", () => {
    it("should update status of an existing user", async () => {
      await db.collection("admin_users").doc("uuid-1").set(adminData);

      const result = await repository.updateStatus(
        "uuid-1",
        AdminUserStatus.REJECTED
      );

      expect(result.status).toBe("rejected");
    });

    it("should throw NotFoundException when user does not exist", async () => {
      await expect(
        repository.updateStatus("nonexistent", AdminUserStatus.ACTIVE)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateRole", () => {
    it("should update role of an existing user", async () => {
      await db.collection("admin_users").doc("uuid-1").set(adminData);

      const result = await repository.updateRole("uuid-1", UserRole.STAFF);

      expect(result.role).toBe("staff");
    });

    it("should throw NotFoundException when user does not exist", async () => {
      await expect(
        repository.updateRole("nonexistent", UserRole.STAFF)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete an existing user", async () => {
      await db.collection("admin_users").doc("uuid-1").set(adminData);

      await repository.delete("uuid-1");

      expect(db.__store.get("admin_users")?.has("uuid-1")).toBe(false);
    });

    it("should throw NotFoundException when user does not exist", async () => {
      await expect(repository.delete("nonexistent")).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
