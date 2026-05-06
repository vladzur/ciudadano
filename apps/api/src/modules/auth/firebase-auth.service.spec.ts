import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { FirebaseAuthService } from "./firebase-auth.service.js";
import { pool } from "@ciudadano/database";

jest.mock("@ciudadano/database", () => ({
  pool: { query: jest.fn() },
}));

// Mock de firebase-admin (subpath imports para ESM)
const mockVerifyIdToken = jest.fn();
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(() => ({ name: "test-app" })),
  getApp: jest.fn(() => ({ name: "test-app" })),
}));
jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe("FirebaseAuthService", () => {
  let service: FirebaseAuthService;

  const mockDecodedToken = {
    uid: "firebase-uid-123",
    email: "ciudadano@gmail.com",
    name: "Ciudadano Test",
    firebase: {
      sign_in_provider: "google.com",
    },
  };

  const mockCitizenRow = {
    id: "citizen-uuid-1",
    firebase_uid: "firebase-uid-123",
    email: "ciudadano@gmail.com",
    display_name: "Ciudadano Test",
    provider: "google.com",
    created_at: "2025-01-01T00:00:00Z",
    last_login: "2025-05-01T00:00:00Z",
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => "test-project") },
        },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  describe("verifyCitizenToken", () => {
    it("should verify token and upsert citizen user", async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockCitizenRow] });

      const result = await service.verifyCitizenToken("valid-id-token");

      expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-id-token");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO citizen_users"),
        expect.arrayContaining(["firebase-uid-123", "ciudadano@gmail.com", "Ciudadano Test", "google.com"])
      );
      expect(result.citizenUser.id).toBe("citizen-uuid-1");
      expect(result.firebaseUid).toBe("firebase-uid-123");
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      await expect(
        service.verifyCitizenToken("invalid-token")
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should handle citizen without email and name", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "firebase-uid-noemail",
        email: undefined,
        name: undefined,
        firebase: { sign_in_provider: "google.com" },
      });
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{
          ...mockCitizenRow,
          email: null,
          display_name: null,
        }],
      });

      const result = await service.verifyCitizenToken("token");

      expect(result.citizenUser.email).toBeNull();
      expect(result.citizenUser.display_name).toBeNull();
    });
  });
});
