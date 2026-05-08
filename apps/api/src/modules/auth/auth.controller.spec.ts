import { Test, TestingModule } from "@nestjs/testing";
import { UserRole } from "@ciudadano/shared";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { FirebaseAuthService } from "./firebase-auth.service.js";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;
  let firebaseAuthService: FirebaseAuthService;

  const mockLoginResponse = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: {
      id: "uuid-1",
      email: "admin@villarrica.cl",
      name: "Admin",
      role: "admin",
      status: "active",
      created_at: "2025-01-01T00:00:00Z",
    },
  };

  const mockCitizenUser = {
    id: "citizen-uuid",
    firebase_uid: "firebase-uid-123",
    email: "ciudadano@gmail.com",
    display_name: "Ciudadano Test",
    provider: "google.com",
    created_at: "2025-01-01T00:00:00Z",
    last_login: "2025-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            findAll: jest.fn(),
            updateStatus: jest.fn(),
            updateRole: jest.fn(),
            deleteUser: jest.fn(),
            signCitizenToken: jest.fn(),
          },
        },
        {
          provide: FirebaseAuthService,
          useValue: {
            verifyCitizenToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    firebaseAuthService = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  describe("login", () => {
    it("should return success response with tokens and user", async () => {
      const loginDto = { email: "admin@villarrica.cl", password: "secret123" };
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ success: true, data: mockLoginResponse });
    });

    it("should propagate errors from auth service", async () => {
      (authService.login as jest.Mock).mockRejectedValue(new Error("Invalid"));

      await expect(controller.login({ email: "x", password: "x" })).rejects.toThrow("Invalid");
    });
  });

  describe("register", () => {
    it("should register user and return success message", async () => {
      const dto = { email: "new@test.cl", password: "secret123", name: "Nuevo" };
      (authService.register as jest.Mock).mockResolvedValue({
        id: "uuid-new",
        email: "new@test.cl",
        name: "Nuevo",
        role: "staff",
        status: "pending",
        created_at: "2025-05-01T00:00:00Z",
      });

      const result = await controller.register(dto);

      expect(result.success).toBe(true);
      expect(result.message).toContain("aprobación");
    });
  });

  describe("citizenAuth", () => {
    it("should verify Firebase token and return JWT", async () => {
      (firebaseAuthService.verifyCitizenToken as jest.Mock).mockResolvedValue({
        citizenUser: mockCitizenUser,
        firebaseUid: "firebase-uid-123",
      });
      (authService.signCitizenToken as jest.Mock).mockReturnValue("citizen-jwt-token");

      const result = await controller.citizenAuth({ idToken: "valid-id-token" });

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe("citizen-jwt-token");
      expect(result.data.user).toEqual(mockCitizenUser);
    });
  });

  describe("listUsers", () => {
    it("should return all users", async () => {
      (authService.findAll as jest.Mock).mockResolvedValue([mockLoginResponse.user]);

      const result = await controller.listUsers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("updateUserStatus", () => {
    it("should update status and return user", async () => {
      (authService.updateStatus as jest.Mock).mockResolvedValue(mockLoginResponse.user);

      const req = { user: { sub: "admin-id" } };
      const result = await controller.updateUserStatus("uuid-2", { status: "active" }, req);

      expect(authService.updateStatus).toHaveBeenCalledWith("uuid-2", "active", "admin-id");
      expect(result.success).toBe(true);
    });
  });

  describe("updateUserRole", () => {
    it("should update role and return user", async () => {
      (authService.updateRole as jest.Mock).mockResolvedValue(mockLoginResponse.user);

      const req = { user: { sub: "admin-id" } };
      const result = await controller.updateUserRole("uuid-2", { role: UserRole.STAFF }, req);

      expect(authService.updateRole).toHaveBeenCalledWith("uuid-2", UserRole.STAFF, "admin-id");
      expect(result.success).toBe(true);
    });
  });

  describe("deleteUser", () => {
    it("should delete user and return success", async () => {
      (authService.deleteUser as jest.Mock).mockResolvedValue(undefined);

      const req = { user: { sub: "admin-id" } };
      const result = await controller.deleteUser("uuid-2", req);

      expect(authService.deleteUser).toHaveBeenCalledWith("uuid-2", "admin-id");
      expect(result.success).toBe(true);
    });
  });
});
