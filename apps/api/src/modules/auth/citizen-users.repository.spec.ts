import type { Firestore } from "firebase-admin/firestore";
import { CitizenUsersRepository } from "./citizen-users.repository.js";
import {
  createMockFirestore,
  mockTimestamp,
  type MockFirestore,
} from "../../testing/firestore.mock.js";

describe("CitizenUsersRepository", () => {
  let db: MockFirestore;
  let repository: CitizenUsersRepository;

  beforeEach(() => {
    db = createMockFirestore();
    repository = new CitizenUsersRepository(db as unknown as Firestore);
  });

  describe("upsertByFirebaseUid", () => {
    it("should create citizen with createdAt on first login", async () => {
      const result = await repository.upsertByFirebaseUid({
        uid: "fb-123",
        email: "ciudadano@gmail.com",
        displayName: "Ciudadano Test",
        provider: "google.com",
      });

      expect(result).toEqual({
        id: "fb-123",
        firebase_uid: "fb-123",
        email: "ciudadano@gmail.com",
        display_name: "Ciudadano Test",
        provider: "google.com",
        created_at: "2025-01-01T00:00:00.000Z",
        last_login: "2025-01-01T00:00:00.000Z",
      });
      // El documento usa el firebase_uid como ID
      expect(db.__store.get("citizen_users")!.has("fb-123")).toBe(true);
    });

    it("should preserve createdAt on subsequent logins", async () => {
      // Simula un ciudadano que ya inició sesión antes
      await db.collection("citizen_users").doc("fb-123").set({
        id: "fb-123",
        email: "viejo@gmail.com",
        displayName: "Viejo Nombre",
        provider: "google.com",
        createdAt: mockTimestamp("2024-06-01T00:00:00Z"),
        lastLogin: mockTimestamp("2024-06-01T00:00:00Z"),
      });

      const result = await repository.upsertByFirebaseUid({
        uid: "fb-123",
        email: "nuevo@gmail.com",
        displayName: "Nuevo Nombre",
        provider: "google.com",
      });

      expect(result.created_at).toBe("2024-06-01T00:00:00.000Z");
      expect(result.email).toBe("nuevo@gmail.com");
      expect(result.display_name).toBe("Nuevo Nombre");
      // lastLogin se actualiza en cada login
      expect(result.last_login).toBe("2025-01-01T00:00:00.000Z");
    });

    it("should handle citizen without email and name", async () => {
      const result = await repository.upsertByFirebaseUid({
        uid: "fb-noemail",
        email: null,
        displayName: null,
        provider: "google.com",
      });

      expect(result.email).toBeNull();
      expect(result.display_name).toBeNull();
    });
  });
});
