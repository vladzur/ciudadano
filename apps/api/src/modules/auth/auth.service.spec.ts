import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { UserRole } from "@ciudadano/shared";
import { AuthService } from "./auth.service.js";
import { AdminUsersRepository } from "./admin-users.repository.js";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;
  let adminUsersRepository: {
    findByEmail: jest.Mock;
    emailExists: jest.Mock;
    create: jest.Mock;
    findAll: jest.Mock;
    updateStatus: jest.Mock;
    updateRole: jest.Mock;
    delete: jest.Mock;
  };

  const mockUser = {
    id: "uuid-1",
    email: "admin@villarrica.cl",
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
    adminUsersRepository = {
      findByEmail: jest.fn(),
      emailExists: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      updateRole: jest.fn(),
      delete: jest.fn(),
    };

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
        {
          provide: AdminUsersRepository,
          useValue: adminUsersRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("login", () => {
    const loginDto = { email: "admin@villarrica.cl", password: "secret123" };

    it("should return tokens and user when credentials are valid and user is active", async () => {
      adminUsersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: "hashed-password",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce("access-token-xyz")
        .mockReturnValueOnce("refresh-token-xyz");

      const result = await service.login(loginDto);

      expect(adminUsersRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        "hashed-password"
      );
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
      // La contraseña nunca se expone en la respuesta
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw UnauthorizedException when user is pending", async () => {
      adminUsersRepository.findByEmail.mockResolvedValue({
        ...mockPendingUser,
        password: "hashed-password",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        "Cuenta pendiente de aprobación."
      );
    });

    it("should throw UnauthorizedException when user is rejected", async () => {
      adminUsersRepository.findByEmail.mockResolvedValue({
        ...mockRejectedUser,
        password: "hashed-password",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        "Cuenta rechazada."
      );
    });

    it("should throw UnauthorizedException when email is not found", async () => {
      adminUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException when password is incorrect", async () => {
      adminUsersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: "hashed-password",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("register", () => {
    const registerDto = {
      email: "new@test.cl",
      password: "secret123",
      name: "Nuevo Usuario",
    };

    it("should create user with pending status and staff role", async () => {
      adminUsersRepository.emailExists.mockResolvedValue(false);
      adminUsersRepository.create.mockResolvedValue({
        id: "uuid-new",
        email: "new@test.cl",
        name: "Nuevo Usuario",
        role: "staff",
        status: "pending",
        created_at: "2025-05-01T00:00:00Z",
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-password");

      const result = await service.register(registerDto);

      expect(result.status).toBe("pending");
      expect(result.role).toBe("staff");
      expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
      expect(adminUsersRepository.create).toHaveBeenCalledWith({
        email: "new@test.cl",
        password: "hashed-new-password",
        name: "Nuevo Usuario",
      });
    });

    it("should throw ConflictException when email already exists", async () => {
      adminUsersRepository.emailExists.mockResolvedValue(true);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      adminUsersRepository.findAll.mockResolvedValue([
        mockUser,
        mockPendingUser,
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(adminUsersRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("should update user status", async () => {
      adminUsersRepository.updateStatus.mockResolvedValue({
        ...mockPendingUser,
        status: "active",
      });

      const result = await service.updateStatus(
        "uuid-2",
        "active",
        "current-admin-id"
      );

      expect(result.status).toBe("active");
      expect(adminUsersRepository.updateStatus).toHaveBeenCalledWith(
        "uuid-2",
        "active"
      );
    });

    it("should throw ForbiddenException when modifying own status", async () => {
      await expect(
        service.updateStatus("uuid-1", "rejected", "uuid-1")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException when user does not exist", async () => {
      adminUsersRepository.updateStatus.mockRejectedValue(
        new NotFoundException("Usuario no encontrado.")
      );

      await expect(
        service.updateStatus("nonexistent", "active", "current-admin-id")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateRole", () => {
    it("should update user role", async () => {
      adminUsersRepository.updateRole.mockResolvedValue({
        ...mockUser,
        role: "staff",
      });

      const result = await service.updateRole(
        "uuid-1",
        UserRole.STAFF,
        "current-admin-id"
      );

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
      adminUsersRepository.delete.mockResolvedValue(undefined);

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
      adminUsersRepository.delete.mockRejectedValue(
        new NotFoundException("Usuario no encontrado.")
      );

      await expect(
        service.deleteUser("nonexistent", "current-admin-id")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("validateUser", () => {
    it("should return the received payload unchanged", async () => {
      const payload = {
        sub: "uuid-1",
        email: "admin@test.cl",
        role: UserRole.ADMIN,
      };
      const result = await service.validateUser(payload);
      expect(result).toEqual(payload);
    });
  });
});
