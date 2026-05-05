import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockLoginResponse = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: {
      id: "uuid-1",
      email: "admin@villarrica.cl",
      name: "Admin",
      role: "admin",
      created_at: "2025-01-01T00:00:00Z",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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
});
