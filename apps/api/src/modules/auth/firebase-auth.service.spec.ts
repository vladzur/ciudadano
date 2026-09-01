import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { FirebaseAuthService } from "./firebase-auth.service.js";
import { CitizenUsersRepository } from "./citizen-users.repository.js";
import { FIREBASE_APP } from "../firebase/firebase.constants.js";

// Mock de firebase-admin/auth (subpath imports para ESM)
const mockVerifyIdToken = jest.fn();
jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe("FirebaseAuthService", () => {
  let service: FirebaseAuthService;
  let citizenUsersRepository: { upsertByFirebaseUid: jest.Mock };

  const mockDecodedToken = {
    uid: "firebase-uid-123",
    email: "ciudadano@gmail.com",
    name: "Ciudadano Test",
    firebase: {
      sign_in_provider: "google.com",
    },
  };

  const mockCitizenUser = {
    id: "firebase-uid-123",
    firebase_uid: "firebase-uid-123",
    email: "ciudadano@gmail.com",
    display_name: "Ciudadano Test",
    provider: "google.com",
    created_at: "2025-01-01T00:00:00Z",
    last_login: "2025-05-01T00:00:00Z",
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    citizenUsersRepository = { upsertByFirebaseUid: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        {
          provide: FIREBASE_APP,
          useValue: { name: "test-app" },
        },
        {
          provide: CitizenUsersRepository,
          useValue: citizenUsersRepository,
        },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  describe("verifyCitizenToken", () => {
    it("should verify token and upsert citizen user", async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      citizenUsersRepository.upsertByFirebaseUid.mockResolvedValue(
        mockCitizenUser
      );

      const result = await service.verifyCitizenToken("valid-id-token");

      expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-id-token");
      expect(citizenUsersRepository.upsertByFirebaseUid).toHaveBeenCalledWith({
        uid: "firebase-uid-123",
        email: "ciudadano@gmail.com",
        displayName: "Ciudadano Test",
        provider: "google.com",
      });
      expect(result.citizenUser.id).toBe("firebase-uid-123");
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
      citizenUsersRepository.upsertByFirebaseUid.mockResolvedValue({
        ...mockCitizenUser,
        email: null,
        display_name: null,
      });

      const result = await service.verifyCitizenToken("token");

      expect(citizenUsersRepository.upsertByFirebaseUid).toHaveBeenCalledWith(
        expect.objectContaining({ email: null, displayName: null })
      );
      expect(result.citizenUser.email).toBeNull();
      expect(result.citizenUser.display_name).toBeNull();
    });
  });
});
