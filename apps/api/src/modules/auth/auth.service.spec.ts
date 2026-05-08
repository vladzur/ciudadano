import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { UserRole } from "@ciudadano/shared";
import { AuthService } from "./auth.service.js";
import { pool } from "@ciudadano/database";
import * as bcrypt from "bcrypt";

jest.mock("@ciudadano/database", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: "uuid-1",
    email: "admin@villarrica.cl",
    password: "hashed-password",
    name: "Admin",
    role: "admin",
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
  };

  const mockPendingUser = {
    ...mockUser,
    id: "uuid-2",
    email: "pending@test.cl",
    status: "pending",
    role: "staff",
  };

  const mockRejectedUser = {
    ...mockUser,
    id: "uuid-3",
    email: "rejected@test.cl",
    status: "rejected",
    role: "staff",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("login", () => {
    const loginDto = { email: "admin@villarrica.cl", password: "secret123" };

    it("should return tokens and user when credentials are valid and user is active", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce("access-token-xyz")
        .mockReturnValueOnce("refresh-token-xyz");

      const result = await service.login(loginDto);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [loginDto.email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: "access-token-xyz",
        refreshToken: "refresh-token-xyz",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          status: mockUser.status,
          created_at: mockUser.created_at,
        },
      });
    });

    it("should throw UnauthorizedException when user is pending", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockPendingUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        "Cuenta pendiente de aprobación."
      );
    });

    it("should throw UnauthorizedException when user is rejected", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRejectedUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        "Cuenta rechazada."
      );
    });

    it("should throw UnauthorizedException when email is not found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when password is incorrect", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("register", () => {
    const registerDto = { email: "new@test.cl", password: "secret123", name: "Nuevo Usuario" };

    it("should create user with pending status and staff role", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // email no existe
        .mockResolvedValueOnce({
          rows: [{ id: "uuid-new", email: "new@test.cl", name: "Nuevo Usuario", role: "staff", status: "pending", created_at: "2025-05-01T00:00:00Z" }],
        });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-password");

      const result = await service.register(registerDto);

      expect(result.status).toBe("pending");
      expect(result.role).toBe("staff");
      expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
    });

    it("should throw ConflictException when email already exists", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: "existing" }] });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should return all users ordered by creation date desc", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser, mockPendingUser] });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC")
      );
    });
  });

  describe("updateStatus", () => {
    it("should update user status", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...mockPendingUser, status: "active" }] });

      const result = await service.updateStatus("uuid-2", "active", "current-admin-id");

      expect(result.status).toBe("active");
    });

    it("should throw ForbiddenException when modifying own status", async () => {
      await expect(
        service.updateStatus("uuid-1", "rejected", "uuid-1")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException when user does not exist", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(
        service.updateStatus("nonexistent", "active", "current-admin-id")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateRole", () => {
    it("should update user role", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...mockUser, role: "staff" }] });

      const result = await service.updateRole("uuid-1", UserRole.STAFF, "current-admin-id");

      expect(result.role).toBe("staff");
    });

    it("should throw ForbiddenException when modifying own role", async () => {
      await expect(
        service.updateRole("uuid-1", UserRole.STAFF, "uuid-1")
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("deleteUser", () => {
    it("should delete user", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      await expect(
        service.deleteUser("uuid-2", "current-admin-id")
      ).resolves.toBeUndefined();
    });

    it("should throw ForbiddenException when deleting self", async () => {
      await expect(
        service.deleteUser("uuid-1", "uuid-1")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException when user does not exist", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      await expect(
        service.deleteUser("nonexistent", "current-admin-id")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("validateUser", () => {
    it("should return the received payload unchanged", async () => {
      const payload = { sub: "uuid-1", email: "admin@test.cl", role: UserRole.ADMIN };
      const result = await service.validateUser(payload);
      expect(result).toEqual(payload);
    });
  });
});
